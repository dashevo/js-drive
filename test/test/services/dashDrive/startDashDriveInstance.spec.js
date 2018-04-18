const Docker = require('dockerode');

class MongoDbInstance {
  constructor() {
    this.options = this.createOptions();
    this.image = 'mongo:3.6';
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
      this.isInitialized = true;
      return;
    }

    await this.createNetwork();
    this.container = await this.createContainer();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.NETWORK.name].IPAddress;

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

    return `${this.containerIp}:${this.options.MONGODB.port}`;
  }

  // eslint-disable-next-line class-methods-use-this
  isNetworkAlreadyCreated(error) {
    return error.message.includes('already exists');
  }

  async removeContainer(container) {
    await container.remove();
    this.isInitialized = false;
  }

  async createNetwork() {
    try {
      const docker = new Docker();
      await docker.createNetwork({
        Name: this.options.NETWORK.name,
        Driver: 'bridge',
        CheckDuplicate: true,
      });
    } catch (error) {
      if (!this.isNetworkAlreadyCreated(error)) {
        throw error;
      }
    }
  }

  async pullImage() {
    return new Promise(async (resolve, reject) => {
      const { image } = this;
      const docker = new Docker();

      try {
        const stream = await docker.pull(image);
        return docker.modem.followProgress(stream, resolve);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async createContainer() {
    const { port } = this.options.MONGODB;

    const ExposedPorts = {};
    ExposedPorts[`${port}/tcp`] = {};

    const PortBindings = {};
    PortBindings[`${port}/tcp`] = [{ HostPort: port.toString() }];

    const EndpointsConfig = {};
    EndpointsConfig[this.options.NETWORK.name] = {};

    await this.pullImage();

    const docker = new Docker();
    let container = await docker.createContainer({
      Image: 'mongo:3.6',
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
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
  }

  createOptions() {
    return {
      MONGODB: {
        port: this.getRandomPort(40002, 49998),
      },
      NETWORK: {
        name: 'dash_test_network',
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

describe('MongoDbInstance', function main() {
  this.timeout(40000);

  describe('before start', () => {
    const instance = new MongoDbInstance();

    it('should not crash if stop', async () => {
      await instance.stop();
    });

    it('should not crash if clean', async () => {
      await instance.clean();
    });

    it('should return null if getIp', () => {
      const ip = instance.getIp();
      expect(ip).to.be.null();
    });

    it('should return null if getAddress', () => {
      const address = instance.getAddress();
      expect(address).to.be.null();
    });
  });

  describe('usage', () => {
    const instance = new MongoDbInstance();

    after(async () => instance.clean());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([
        'mongod',
      ]);
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should return container IP', () => {
      expect(instance.getIp()).to.be.equal(instance.containerIp);
    });

    it('should return container address', () => {
      expect(instance.getAddress()).to.be.equal(`${instance.containerIp}:${instance.options.MONGODB.port}`);
    });

    it('should clean the instance', async () => {
      await instance.clean();

      let error;
      try {
        await instance.container.inspect();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });
});

const ECR = require('aws-sdk/clients/ecr');

class DashDriveInstance {
  constructor({ ENV = {} } = {}) {
    this.options = this.createOptions();
    this.options.ENV = ENV;
    this.image = '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashdrive';
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
      this.isInitialized = true;
      return;
    }

    await this.createNetwork();
    this.container = await this.createContainer();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.NETWORK.name].IPAddress;

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

    return `${this.containerIp}`;
  }

  // eslint-disable-next-line class-methods-use-this
  isNetworkAlreadyCreated(error) {
    return error.message.includes('already exists');
  }

  async removeContainer(container) {
    await container.remove();
    this.isInitialized = false;
  }

  async createNetwork() {
    try {
      const docker = new Docker();
      await docker.createNetwork({
        Name: this.options.NETWORK.name,
        Driver: 'bridge',
        CheckDuplicate: true,
      });
    } catch (error) {
      if (!this.isNetworkAlreadyCreated(error)) {
        throw error;
      }
    }
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

  async pullImage() {
    return new Promise(async (resolve, reject) => {
      const { image } = this;
      const docker = new Docker();

      try {
        const authorization = await this.getAuthorizationToken();
        const stream = await docker.pull(image, { authconfig: authorization });
        return docker.modem.followProgress(stream, resolve);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async createContainer() {
    const EndpointsConfig = {};
    EndpointsConfig[this.options.NETWORK.name] = {};

    await this.pullImage();

    const docker = new Docker();
    let container = await docker.createContainer({
      Image: this.image,
      Env: this.options.ENV,
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
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
  }

  // eslint-disable-next-line class-methods-use-this
  createOptions() {
    return {
      NETWORK: {
        name: 'dash_test_network',
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

describe('DashDriveInstance', function main() {
  this.timeout(90000);

  describe('before start', () => {
    const instance = new DashDriveInstance();

    it('should not crash if stop', async () => {
      await instance.stop();
    });

    it('should not crash if clean', async () => {
      await instance.clean();
    });

    it('should return null if getIp', () => {
      const ip = instance.getIp();
      expect(ip).to.be.null();
    });

    it('should return null if getAddress', () => {
      const address = instance.getAddress();
      expect(address).to.be.null();
    });
  });

  describe('usage', () => {
    const ENV = [
      'API_RPC_PORT=6000',
      'API_RPC_HOST=0.0.0.0',
      'STORAGE_IPFS_MULTIADDR=/ip4/127.0.0.1/tcp/5001',
      'STORAGE_MONGODB_URL=mongodb://127.0.0.1',
      'STORAGE_MONGODB_DB=storage',
      'DASHCORE_ZMQ_PUB_HASHBLOCK=tcp://127.0.0.1:28332',
      'DASHCORE_JSON_RPC_HOST=127.0.0.1',
      'DASHCORE_JSON_RPC_PORT=9998',
      'DASHCORE_JSON_RPC_USER=dashrpc',
      'DASHCORE_JSON_RPC_PASS=password',
      'SYNC_EVO_START_BLOCK_HEIGHT=1',
      'SYNC_STATE_BLOCKS_LIMIT=12',
      'SYNC_STATE_CHECK_INTERVAL=10',
      'SYNC_CHAIN_CHECK_INTERVAL=5',
    ];
    const instance = new DashDriveInstance({
      ENV,
    });

    after(async () => instance.clean());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.inspect();

      const instanceEnv = Env.filter(variable => ENV.includes(variable));
      expect(ENV.length).to.deep.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([]);
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should return container IP', () => {
      expect(instance.getIp()).to.be.equal(instance.containerIp);
    });

    it('should return container address', () => {
      expect(instance.getAddress()).to.be.equal(`${instance.containerIp}`);
    });

    it('should clean the instance', async () => {
      await instance.clean();

      let error;
      try {
        await instance.container.inspect();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });
});

async function startDashDriveInstance() {
  const instances = await startDashDriveInstance.many(1);
  return instances[0];
}

startDashDriveInstance.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const mongoDbInstance = new MongoDbInstance();
    await mongoDbInstance.start();

    const ENV = [
      'API_RPC_PORT=6000',
      'API_RPC_HOST=0.0.0.0',
      'STORAGE_IPFS_MULTIADDR=/ip4/127.0.0.1/tcp/5001',
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getAddress()}`,
      'STORAGE_MONGODB_DB=storage',
      'DASHCORE_ZMQ_PUB_HASHBLOCK=tcp://127.0.0.1:28332',
      'DASHCORE_JSON_RPC_HOST=127.0.0.1',
      'DASHCORE_JSON_RPC_PORT=9998',
      'DASHCORE_JSON_RPC_USER=dashrpc',
      'DASHCORE_JSON_RPC_PASS=password',
      'SYNC_EVO_START_BLOCK_HEIGHT=1',
      'SYNC_STATE_BLOCKS_LIMIT=12',
      'SYNC_STATE_CHECK_INTERVAL=10',
      'SYNC_CHAIN_CHECK_INTERVAL=5',
    ];
    const dashDriveInstance = new DashDriveInstance({
      ENV,
    });
    await dashDriveInstance.start();

    const instance = {
      mongoDb: mongoDbInstance,
      dashDrive: dashDriveInstance,
    };

    instances.push(instance);
  }

  after(async () => {
    const promises = instances.map(instance => Promise.all([
      instance.mongoDb.clean(),
      instance.dashDrive.clean(),
    ]));
    await Promise.all(promises);
  });

  return instances;
};

describe('startDashDriveInstance', function main() {
  this.timeout(40000);

  describe('One instance', () => {
    let instance;

    before(async () => {
      instance = await startDashDriveInstance();
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container running', async () => {
      const { State } = await instance.dashDrive.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container has the right MongoDb address', async () => {
      const { Config: { Env } } = await instance.dashDrive.container.inspect();
      const expectedEnv = `STORAGE_MONGODB_URL=mongodb://${instance.mongoDb.getAddress()}`;
      const mongoAddressVariable = Env.filter(variable => variable === expectedEnv);
      expect(mongoAddressVariable.length).to.equal(1);
    });

    it('should be on the same network (DashDrive and MongoDb)', async () => {
      const {
        NetworkSettings: dashDriveNetworkSettings,
      } = await instance.dashDrive.container.inspect();
      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await instance.mongoDb.container.inspect();

      expect(Object.keys(dashDriveNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
    });
  });

  describe('Three instance', () => {
  });
});
