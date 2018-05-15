class Network {
  /**
   * Create Docker network
   *
   * @param {Docker} docker
   * @param {String} name
   * @param {String} driver
   */
  constructor(docker, name, driver) {
    this.docker = docker;
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
   *
   * @return {Boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isNetworkAlreadyCreated(error) {
    return error.message.includes('already exists');
  }
}

module.exports = Network;
