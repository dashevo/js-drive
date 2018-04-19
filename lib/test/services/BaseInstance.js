const Docker = require('dockerode');
const ECR = require('aws-sdk/clients/ecr');

class Image {
  constructor({ image, authorization = false }) {
    this.docker = new Docker();
    this.ecr = new ECR({ region: process.env.AWS_DEFAULT_REGION });
    this.image = image;
    this.authorization = authorization;
  }

  async pull() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.authorization) {
          const authconfig = await this.getAuthorizationToken();
          const stream = await this.docker.pull(this.image, { authconfig });
          return this.docker.modem.followProgress(stream, resolve);
        }

        const stream = await this.docker.pull(this.image);
        return this.docker.modem.followProgress(stream, resolve);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async getAuthorizationToken() {
    return new Promise((resolve, reject) => {
      this.ecr.getAuthorizationToken((error, authorization) => {
        if (error) {
          return reject(error);
        }
        const {
          authorizationToken,
          proxyEndpoint: serveraddress,
        } = authorization.authorizationData[0];
        const creds = Buffer.from(authorizationToken, 'base64').toString();
        const [username, password] = creds.split(':');
        return resolve({ username, password, serveraddress });
      });
    });
  }
}

class Network {
  constructor({ name, driver }) {
    this.docker = new Docker();
    this.name = name;
    this.driver = driver;
  }

  async create() {
    try {
      await this.docker.createNetwork({
        Name: this.name,
        Driver: this.driver,
        CheckDuplicate: true,
      });
    } catch (error) {
      if (!this.isNetworkAlreadyCreated(error)) {
        throw error;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  isNetworkAlreadyCreated(error) {
    return error.message.includes('already exists');
  }
}

class Container {
  constructor(options) {
    this.docker = new Docker();
    this.options = options;
    this.container = null;
    this.containerIp = null;
    this.initialized = false;
  }

  async start() {
    if (this.initialized) {
      return;
    }
    this.container = await this.create();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.network.name].IPAddress;
  }

  isInitialized() {
    return this.initialized;
  }

  async stop() {
    if (!this.initialized) {
      return;
    }
    await this.container.stop();
    this.initialized = false;
  }

  async inspect() {
    const details = await this.container.inspect();
    return details;
  }

  async remove() {
    if (!this.initialized) {
      return;
    }
    await this.container.stop();
    await this.container.remove();
    this.initialized = false;
  }

  getIp() {
    return this.containerIp;
  }

  getAddress() {
    if (!this.options.ports.MAIN_PORT) {
      return `${this.containerIp}`;
    }
    return `${this.containerIp}:${this.options.ports.MAIN_PORT}`;
  }

  async create() {
    const ports = Object.entries(this.options.ports).map(([, value]) => value);
    const ExposedPorts = this.createExposedPorts(ports);
    const PortBindings = this.createPortBindings(ports);

    const EndpointsConfig = {};
    EndpointsConfig[this.options.network.name] = {};

    const params = {
      Image: this.options.image.name,
      Env: this.options.envs,
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig,
      },
    };
    if (this.options.cmd) {
      params.Cmd = this.options.cmd;
    }

    let container = await this.docker.createContainer(params);
    try {
      await container.start();
    } catch (error) {
      if (!this.isPortAllocated(error)) {
        throw error;
      }
      await this.removeContainer(container);
      this.options = this.options.generate();
      container = await this.create();
    }

    return container;
  }

  async removeContainer(container) {
    await container.remove();
    this.initialized = false;
  }

  // eslint-disable-next-line class-methods-use-this
  createExposedPorts(ports) {
    return ports.reduce((exposedPorts, port) => {
      const result = exposedPorts;
      result[`${port}/tcp`] = {};
      return result;
    }, {});
  }

  // eslint-disable-next-line class-methods-use-this
  createPortBindings(ports) {
    return ports.reduce((portBindings, port) => {
      const result = portBindings;
      result[`${port}/tcp`] = [{ HostPort: port.toString() }];
      return result;
    }, {});
  }

  // eslint-disable-next-line class-methods-use-this
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
  }
}

class BaseInstance {
  constructor(options) {
    this.options = options;
    this.options.ports = this.options.ports || {};
    this.network = new Network({
      name: this.options.network.name,
      driver: this.options.network.driver,
    });
    this.image = new Image({
      image: this.options.image.name,
      authorization: this.options.image.authorization,
    });
    this.container = new Container(this.options);
  }

  async start() {
    await this.network.create();
    await this.image.pull();
    await this.container.start();
    await this.initialization();
  }

  async initialization() {
    this.container.initialized = true;
  }

  async isInitialized() {
    return this.container.isInitialized();
  }

  async stop() {
    await this.container.stop();
  }

  async clean() {
    await this.container.remove();
  }

  getIp() {
    return this.container.getIp();
  }

  getAddress() {
    return this.container.getAddress();
  }
}

module.exports = BaseInstance;
