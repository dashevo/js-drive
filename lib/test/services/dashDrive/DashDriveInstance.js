const DockerInstance = require('../docker/DockerInstance');

class DashDriveInstance extends DockerInstance {
  /**
   * Create DashDrive instance
   *
   * @param {Network} network
   * @param {Image} image
   * @param {Container} container
   * @param {jaysonClient} rpcClient
   * @param {DashDriveInstanceOptions} options
   */
  constructor(network, image, container, rpcClient, options) {
    super(network, image, container, options);
    this.rpcClient = rpcClient;
    this.options = options;
  }

  /**
   * Get DashDrive api
   *
   * @return {object}
   */
  async getApi() {
    return this.createRpcClient();
  }

  /**
   * Get Rpc port
   *
   * @return {int} port
   */
  getRpcPort() {
    return this.options.getRpcPort();
  }

  /**
   * @private
   *
   * @return {Object} rpcClient
   */
  async createRpcClient() {
    const client = this.rpcClient.http({
      port: this.options.getRpcPort(),
    });

    return new Promise((resolve) => {
      function request() {
        client.request('', [], (error) => {
          if (error && error.message === 'socket hang up') {
            return setTimeout(request, 1000);
          }
          return resolve(client);
        });
      }
      request();
    });
  }
}

module.exports = DashDriveInstance;
