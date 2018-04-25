class BaseInstance {
  constructor(network, image, container, options) {
    this.network = network;
    this.image = image;
    this.container = container;
    this.options = options;
  }

  /**
   * Start container
   *
   * @return {Promise<void>}
   */
  async start() {
    await this.network.create();
    await this.image.pull();
    try {
      await this.container.start();
    } catch (error) {
      if (!this.isPortAllocated(error)) {
        throw error;
      }
      await this.container;
      this.options.regeneratePorts();
      const containerOptions = this.options.getContainerOptions();
      this.container.setOptions(containerOptions);
      await this.start();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
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
