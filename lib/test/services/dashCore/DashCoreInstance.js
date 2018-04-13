const Docker = require('dockerode');
const RpcClient = require('@dashevo/bitcoind-rpc-dash/promise');

class DashCoreInstance {
  constructor() {
    this.options = this.createOptions();
    this.container = null;
    this.rpcClient = null;
    this.containerIp = null;
    this.isInitialized = false;
  }

  /**
   * Start DashCore instance
   *
   * @return {Promise<void>}
   */
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
    this.rpcClient = await this.createRpcClient();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.NETWORK.name].IPAddress;
    await this.initialization();
  }

  /**
   * Connect to another DashCore instance
   *
   * @param {Object} DashCoreInstance
   * @return {Promise<void>}
   */
  async connect(dashCoreInstance) {
    if (!this.isInitialized) {
      throw new Error('Instance should be started before!');
    }

    const address = dashCoreInstance.getAddress();
    await this.rpcClient.addNode(address, 'add');
  }

  /**
   * Stop DashCore instance
   *
   * @return {Promise<void>}
   */
  async stop() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();

    this.isInitialized = false;
  }

  /**
   * Clean DashCore instance
   *
   * @return {Promise<void>}
   */
  async clean() {
    if (!this.isInitialized) {
      return;
    }

    await this.removeContainer(this.container);
  }

  /**
   * Get the IP of the DashCore container
   *
   * @return {String}
   */
  getIp() {
    return this.containerIp;
  }

  /**
   * Get the IP and port where dashd is running
   *
   * @return {String}
   */
  getAddress() {
    if (!this.isInitialized) {
      return null;
    }

    return `${this.containerIp}:${this.options.CORE.port}`;
  }

  /**
   * Get the RPC client to interact with DashCore
   *
   * @return {Object}
   */
  getApi() {
    if (!this.isInitialized) {
      return {};
    }

    return this.rpcClient;
  }

  /**
   * Get the configuration for ZeroMQ subscribers
   *
   * @return {Object}
   */
  getZmqSockets() {
    if (!this.isInitialized) {
      return {};
    }

    return {
      hashblock: `tcp://127.0.0.1:${this.options.ZMQ.port}`,
    };
  }

  /**
   * @private
   */
  async createNetwork() {
    const docker = new Docker();
    await docker.createNetwork({
      Name: this.options.NETWORK.name,
      Driver: 'bridge',
      CheckDuplicate: true,
    }).catch(() => null);
  }

  /**
   * @private
   */
  async createContainer() {
    const { port: rpcPort, user: rpcUser, password: rpcPassword } = this.options.RPC;
    const { port: pubPort } = this.options.ZMQ;

    const ExposedPorts = {};
    ExposedPorts[`${rpcPort}/tcp`] = {};
    ExposedPorts[`${pubPort}/tcp`] = {};

    const PortBindings = {};
    PortBindings[`${rpcPort}/tcp`] = [{ HostPort: rpcPort.toString() }];
    PortBindings[`${pubPort}/tcp`] = [{ HostPort: pubPort.toString() }];

    const EndpointsConfig = {};
    EndpointsConfig[this.options.NETWORK.name] = {};

    const docker = new Docker();
    let container = await docker.createContainer({
      Image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      Cmd: [
        'dashd',
        `-port=${this.options.CORE.port}`,
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${rpcPort}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${pubPort}`,
      ],
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
      await this.removeContainer(container);
      this.options = this.createOptions();
      container = await this.createContainer(this.options);
      return container;
    }

    return container;
  }

  /**
   * @private
   */
  async removeContainer(container) {
    await container.stop().catch(() => null);
    await container.remove();
    this.isInitialized = false;
  }

  /**
   * @private
   */
  async initialization() {
    while (!this.isInitialized) {
      try {
        await this.rpcClient.getInfo();
        this.isInitialized = true;
      } catch (error) {
        this.isInitialized = false;
      }
    }
  }

  /**
   * @private
   */
  async createRpcClient() {
    return new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.options.RPC.port,
      user: this.options.RPC.user,
      pass: this.options.RPC.password,
    });
  }

  /**
   * @private
   */
  createOptions() {
    return {
      CORE: {
        port: this.getRandomPort(40002, 49998),
      },
      RPC: {
        port: this.getRandomPort(20002, 29998),
        user: 'dashrpc',
        password: 'password',
      },
      ZMQ: {
        port: this.getRandomPort(30002, 39998),
      },
      NETWORK: {
        name: 'dash_test_network',
      },
    };
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = DashCoreInstance;
