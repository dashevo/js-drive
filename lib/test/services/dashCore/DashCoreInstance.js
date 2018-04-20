const RpcClient = require('bitcoind-rpc-dash/promise');
const BaseInstance = require('../BaseInstance');

function getRandomPort(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

class DashCoreInstanceOptions {
  constructor() {
    this.image = {
      name: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      authorization: true,
    };
    this.ports = {
      MAIN_PORT: getRandomPort(20002, 29998),
      RPC: getRandomPort(30002, 39998),
      ZMQ: getRandomPort(40002, 49998),
    };
    this.rpc = {
      user: 'dashrpc',
      password: 'password',
    };
    this.cmd = [
      'dashd',
      `-port=${this.ports.MAIN_PORT}`,
      `-rpcuser=${this.rpc.user}`,
      `-rpcpassword=${this.rpc.password}`,
      '-rpcallowip=0.0.0.0/0',
      '-regtest=1',
      `-rpcport=${this.ports.RPC}`,
      `-zmqpubhashblock=tcp://0.0.0.0:${this.ports.ZMQ}`,
    ];
    this.network = {
      name: 'dash_test_network',
      driver: 'bridge',
    };
  }

  generate() {
    this.ports = {
      MAIN_PORT: getRandomPort(20002, 29998),
      RPC: getRandomPort(30002, 39998),
      ZMQ: getRandomPort(40002, 49998),
    };
    this.cmd = [
      'dashd',
      `-port=${this.ports.MAIN_PORT}`,
      `-rpcuser=${this.rpc.user}`,
      `-rpcpassword=${this.rpc.password}`,
      '-rpcallowip=0.0.0.0/0',
      '-regtest=1',
      `-rpcport=${this.ports.RPC}`,
      `-zmqpubhashblock=tcp://0.0.0.0:${this.ports.ZMQ}`,
    ];
    return this;
  }
}

class DashCoreInstance extends BaseInstance {
  constructor() {
    super(new DashCoreInstanceOptions());
  }

  createRpcClient() {
    return new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.container.options.ports.RPC,
      user: this.container.options.rpc.user,
      pass: this.container.options.rpc.password,
    });
  }

  /**
   * Connect to another DashCore instance
   *
   * @param {Object} DashCoreInstance
   * @return {Promise<void>}
   */
  async connect(dashCoreInstance) {
    if (!this.container || !this.container.isInitialized()) {
      throw new Error('Instance should be started before!');
    }

    const address = dashCoreInstance.getAddress();
    await this.rpcClient.addNode(address, 'add');
  }

  getApi() {
    if (!this.container.isInitialized()) {
      return {};
    }

    return this.rpcClient;
  }

  getZmqSockets() {
    if (!this.container.isInitialized()) {
      return {};
    }

    return {
      hashblock: `tcp://127.0.0.1:${this.options.ports.ZMQ}`,
    };
  }

  async initialization() {
    this.rpcClient = await this.createRpcClient();

    while (!this.container.isInitialized()) {
      try {
        await this.rpcClient.getInfo();
        this.container.initialized = true;
      } catch (error) {
        if (!this.isLoadingWallet(error)) {
          throw error;
        }
        this.container.initialized = false;
      }
    }
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  isLoadingWallet(error) {
    const messages = [
      'Loading',
      'Starting',
      'Verifying',
      'RPC',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return loading.length;
  }
}

module.exports = DashCoreInstance;
