const Docker = require('dockerode');

class Network {
  constructor(options) {
    this.docker = new Docker();
    this.name = options.getNetworkName();
    this.driver = options.getNetworkDriver();
  }

  /**
   * Create network
   *
   * @return {Promise<void>}
   */
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

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  isNetworkAlreadyCreated(error) {
    return error.message.includes('already exists');
  }
}

module.exports = Network;
