const Network = require('./Network');
const Image = require('./Image');
const Container = require('./Container');

class BaseInstance {
  constructor(network, image, container) {
    this.network = network;
    this.image = image;
    this.container = container;
  }

  /**
   * Start container
   *
   * @return {Promise<void>}
   */
  async start() {
    await this.network.create();
    await this.image.pull();
    await this.container.start();
  }

  /**
   * Stop container
   *
   * @return {Promise<void>}
   */
  async stop() {
    await this.container.stop();
  }

  /**
   * Clean container
   *
   * @return {Promise<void>}
   */
  async clean() {
    await this.container.remove();
  }

  /**
   * Get container IP
   *
   * @return {String}
   */
  getIp() {
    return this.container.getIp();
  }

  /**
   * Check if container is initialized
   *
   * @return {Boolean}
   */
  isInitialized() {
    return this.container.isInitialized();
  }
}

module.exports = BaseInstance;
