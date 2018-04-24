const RpcClient = require('bitcoind-rpc-dash/promise');
const BaseInstance = require('../docker/BaseInstance');
const DashCoreInstanceOptions = require('./DashCoreInstanceOptions');

class DashCoreInstance extends BaseInstance {
  constructor(network, image, container, RpcClient) {
    super(network, image, container);
    this.RpcClient = RpcClient;
  }

  /**
   * Start instance
   *
   * @return {Promise<void>}
   */
  async start() {
    await super.start();
    await this.initialization();
  }

  /**
   * Connect to another DashCore instance
   *
   * @param {Object} DashCoreInstance
   * @return {Promise<void>}
   */
  async connect(dashCoreInstance) {
    if (!this.isInitialized()) {
      throw new Error('Instance should be started before!');
    }

    const ip = dashCoreInstance.getIp();
    const port = dashCoreInstance.container.options.getMainPort();
    await this.rpcClient.addNode(`${ip}:${port}`, 'add');
  }

  /**
   * Get RPC client
   *
   * @return {Object}
   */
  getApi() {
    if (!this.isInitialized()) {
      return {};
    }

    return this.rpcClient;
  }

  /**
   * Get ZMQ configuration
   *
   * @return {Object}
   */
  getZmqSockets() {
    if (!this.isInitialized()) {
      return {};
    }

    return {
      hashblock: `tcp://127.0.0.1:${this.container.options.ports.ZMQ}`,
    };
  }

  /**
   * @private
   */
  async initialization() {
    this.rpcClient = await this.createRpcClient();

    let nodeStarting = true;
    while (nodeStarting) {
      try {
        await this.rpcClient.getInfo();
        nodeStarting = false;
      } catch (error) {
        if (!this.isLoadingWallet(error)) {
          throw error;
        }
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
      'Masternode cache is empty',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return loading.length;
  }

  /**
   * @private
   */
  createRpcClient() {
    return new this.RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.container.options.ports.RPC,
      user: this.container.options.rpc.user,
      pass: this.container.options.rpc.password,
    });
  }
}

module.exports = DashCoreInstance;
