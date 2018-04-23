const RpcClient = require('bitcoind-rpc-dash/promise');
const BaseInstance = require('../docker/BaseInstance');
const DashCoreInstanceOptions = require('./DashCoreInstanceOptions');

class DashCoreInstance extends BaseInstance {
  constructor() {
    super(new DashCoreInstanceOptions());
  }

  async start() {
    await super.start();
    await this.initialization();
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
    if (!this.isInitialized()) {
      throw new Error('Instance should be started before!');
    }

    const ip = dashCoreInstance.getIp();
    const port = dashCoreInstance.options.getMainPort();
    await this.rpcClient.addNode(`${ip}:${port}`, 'add');
  }

  getApi() {
    if (!this.isInitialized()) {
      return {};
    }

    return this.rpcClient;
  }

  getZmqSockets() {
    if (!this.isInitialized()) {
      return {};
    }

    return {
      hashblock: `tcp://127.0.0.1:${this.options.ports.ZMQ}`,
    };
  }

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
}

module.exports = DashCoreInstance;
