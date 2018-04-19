const Docker = require('dockerode');
const ECR = require('aws-sdk/clients/ecr');

class BaseInstance {
  constructor() {
    this.options = this.createOptions();
    this.image = {};
    this.container = null;
    this.containerIp = null;
    this.isInitialized = false;
  }

  async start() {
    if (this.isInitialized) {
      return;
    }
    if (this.container) {
      await this.container.start();
      await this.initialization();
      return;
    }

    await this.createNetwork();
    this.container = await this.createContainer();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.NETWORK.name].IPAddress;

    await this.initialization();
  }

  async initialization() {
    this.isInitialized = true;
  }

  async stop() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();

    this.isInitialized = false;
  }

  async clean() {
    if (!this.isInitialized) {
      return;
    }

    await this.stop();
    await this.removeContainer(this.container);
  }

  getIp() {
    return this.containerIp;
  }

  getAddress() {
    if (!this.isInitialized) {
      return null;
    }

    if (!this.options.PORTS.MAIN_PORT) {
      return `${this.containerIp}`;
    }

    return `${this.containerIp}:${this.options.PORTS.MAIN_PORT}`;
  }

  async createNetwork() {
    try {
      const docker = new Docker();
      await docker.createNetwork({
        Name: this.options.NETWORK.name,
        Driver: this.options.NETWORK.driver,
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

  async createContainer() {
    const ports = Object.entries(this.options.PORTS).map(([, value]) => value);
    const ExposedPorts = this.createExposedPorts(ports);
    const PortBindings = this.createPortBindings(ports);

    const EndpointsConfig = {};
    EndpointsConfig[this.options.NETWORK.name] = {};

    await this.pullImage();

    const docker = new Docker();
    let container = await docker.createContainer({
      Image: this.image.name,
      Cmd: this.options.CMD,
      Env: this.options.ENV,
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig,
      },
    });

    try {
      await container.start();
    } catch (error) {
      if (!this.isPortAllocated(error)) {
        throw error;
      }
      await this.removeContainer(container);
      this.options = this.createOptions();
      container = await this.createContainer(this.options);
    }

    return container;
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

  async pullImage() {
    return new Promise(async (resolve, reject) => {
      const { image } = this;
      const docker = new Docker();

      try {
        if (image.authorization) {
          const authorization = await this.getAuthorizationToken();
          const stream = await docker.pull(image.name, { authconfig: authorization });
          return docker.modem.followProgress(stream, resolve);
        }

        const stream = await docker.pull(image.name);
        return docker.modem.followProgress(stream, resolve);
      } catch (error) {
        return reject(error);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async getAuthorizationToken() {
    return new Promise((resolve, reject) => {
      const ecr = new ECR({
        region: process.env.AWS_DEFAULT_REGION,
      });
      ecr.getAuthorizationToken((error, authorization) => {
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

  // eslint-disable-next-line class-methods-use-this
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
  }

  async removeContainer(container) {
    await container.remove();
    this.isInitialized = false;
  }

  // eslint-disable-next-line class-methods-use-this
  createOptions() {
    return {
      PORTS: {},
      ENV: [],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = BaseInstance;
