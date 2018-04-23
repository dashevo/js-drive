const Docker = require('dockerode');

class Network {
  constructor({ name, driver } = {}) {
    this.docker = new Docker();
    this.name = name;
    this.driver = driver;
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
