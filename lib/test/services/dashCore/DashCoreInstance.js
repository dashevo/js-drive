const RpcClient = require('bitcoind-rpc-dash/promise');
const BaseInstance = require('../BaseInstance');

class DashCoreInstance extends BaseInstance {
  constructor() {
    super();

    this.options = this.createOptions();
    this.image = {
      name: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      authorization: true,
    };
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

  /**
   * Clean DashCore instance
   *
   * @return {Promise<void>}
   */

  /**
   * Get the IP of the DashCore container
   *
   * @return {String}
   */

  /**
   * Get the IP and port where dashd is running
   *
   * @return {String}
   */

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
      hashblock: `tcp://127.0.0.1:${this.options.PORTS.ZMQ}`,
    };
  }

  /**
   * @private
   */
  async initialization() {
    this.rpcClient = await this.createRpcClient();

    while (!this.isInitialized) {
      try {
        await this.rpcClient.getInfo();
        this.isInitialized = true;
      } catch (error) {
        if (!this.isLoadingWallet(error)) {
          throw error;
        }
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

  /**
   * @private
   */
  createOptions() {
    const corePort = this.getRandomPort(40002, 49998);
    const rpcPort = this.getRandomPort(20002, 29998);
    const zmqPort = this.getRandomPort(30002, 39998);

    const rpcUser = 'dashrpc';
    const rpcPassword = 'password';

    return {
      CMD: [
        'dashd',
        `-port=${corePort}`,
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${rpcPort}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${zmqPort}`,
      ],
      PORTS: {
        MAIN_PORT: corePort,
        RPC: rpcPort,
        ZMQ: zmqPort,
      },
      RPC: {
        user: rpcUser,
        password: rpcPassword,
      },
      NETWORK: {
        name: 'dash_test_network',
      },
    };
  }
}

module.exports = DashCoreInstance;
