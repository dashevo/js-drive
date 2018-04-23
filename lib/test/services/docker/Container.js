const Docker = require('dockerode');

class Container {
  constructor(options) {
    this.docker = new Docker();
    this.options = options;
    this.container = null;
    this.containerIp = null;
    this.initialized = false;
  }

  /**
   * Start container
   *
   * @return {Promise<void>}
   */
  async start() {
    if (this.initialized) {
      return;
    }
    if (this.container) {
      await this.container.start();
      this.initialized = true;
      return;
    }

    this.container = await this.create();
    const { NetworkSettings: { Networks } } = await this.container.inspect();
    this.containerIp = Networks[this.options.network.name].IPAddress;

    this.initialized = true;
  }

  /**
   * Stop container
   *
   * @return {Promise<void>}
   */
  async stop() {
    if (!this.initialized) {
      return;
    }
    await this.container.stop();
    this.initialized = false;
  }

  /**
   * Remove container
   *
   * @return {Promise<void>}
   */
  async remove() {
    if (!this.initialized) {
      return;
    }
    await this.container.stop();
    await this.container.remove();
    this.initialized = false;
  }

  /**
   * Retrieve container details
   *
   * @return {Promise<details>}
   */
  async details() {
    return this.container.inspect();
  }

  /**
   * Get container IP
   *
   * @return {String}
   */
  getIp() {
    if (!this.initialized) {
      return null;
    }
    return this.containerIp;
  }

  /**
   * Check if container is initialized
   *
   * @return {Boolean}
   */
  isInitialized() {
    return this.container && this.initialized;
  }

  /**
   * @private
   */
  async create() {
    const ports = Object.entries(this.options.ports).map(([, value]) => value);
    const ExposedPorts = this.createExposedPorts(ports);
    const PortBindings = this.createPortBindings(ports);

    const EndpointsConfig = {};
    EndpointsConfig[this.options.network.name] = {};

    const params = {
      Image: this.options.image.name,
      Env: this.options.envs || [],
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig,
      },
    };
    if (this.options.cmd) {
      params.Cmd = this.options.cmd;
    }

    let container = await this.docker.createContainer(params);
    try {
      await container.start();
    } catch (error) {
      if (!this.isPortAllocated(error)) {
        throw error;
      }
      await this.removeContainer(container);
      this.options = this.options.getOptions();
      container = await this.create();
    }

    return container;
  }

  /**
   * @private
   */
  async removeContainer(container) {
    await container.remove();
    this.initialized = false;
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  createExposedPorts(ports) {
    return ports.reduce((exposedPorts, port) => {
      const result = exposedPorts;
      result[`${port}/tcp`] = {};
      return result;
    }, {});
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  createPortBindings(ports) {
    return ports.reduce((portBindings, port) => {
      const result = portBindings;
      result[`${port}/tcp`] = [{ HostPort: port.toString() }];
      return result;
    }, {});
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  isPortAllocated(error) {
    const messages = [
      'already allocated',
      'already in use',
    ];
    const errors = messages.filter(message => error.message.includes(message));
    return errors.length;
  }
}

module.exports = Container;
