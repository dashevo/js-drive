const RpcClient = require('bitcoind-rpc-dash/promise');
const BaseInstance = require('../BaseInstance');

function getRandomPort(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function generate() {
  const corePort = getRandomPort(20002, 29998);
  const rpcPort = getRandomPort(30002, 39998);
  const zmqPort = getRandomPort(40002, 49998);

  const rpcUser = 'dashrpc';
  const rpcPassword = 'password';

  return {
    cmd: [
      'dashd',
      `-port=${corePort}`,
      `-rpcuser=${rpcUser}`,
      `-rpcpassword=${rpcPassword}`,
      '-rpcallowip=0.0.0.0/0',
      '-regtest=1',
      `-rpcport=${rpcPort}`,
      `-zmqpubhashblock=tcp://0.0.0.0:${zmqPort}`,
    ],
    ports: {
      MAIN_PORT: corePort,
      RPC: rpcPort,
      ZMQ: zmqPort,
    },
    rpc: {
      user: rpcUser,
      password: rpcPassword,
    },
    image: {
      name: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      authorization: true,
    },
    network: {
      name: 'dash_test_network',
    },
  };
}

const options = generate();
options.generate = generate;

class DashCoreInstance extends BaseInstance {
  constructor() {
    super(options);

    this.rpcClient = new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: options.ports.RPC,
      user: options.rpc.user,
      pass: options.rpc.password,
    });
    this.options = options;
  }

  /**
   * Start DashCore instance
   *
   * @return {Promise<void>}
   */

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
  async createRpcClient() {
    return new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.options.PORTS.RPC,
      user: this.options.RPC.user,
      pass: this.options.RPC.password,
    });
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
