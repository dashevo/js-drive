const Network = require('./Network');
const Image = require('./Image');
const Container = require('./Container');

class BaseInstance {
  constructor(options) {
    this.options = options;
    this.network = new Network(this.options.network);
    this.image = new Image(this.options.image);
    this.container = new Container(this.options);
  }

  async start() {
    await this.network.create();
    await this.image.pull();
    await this.container.start();
  }

  isInitialized() {
    return this.container.isInitialized();
  }

  async stop() {
    await this.container.stop();
  }

  async clean() {
    await this.container.remove();
  }

  getIp() {
    return this.container.getIp();
  }

  getAddress() {
    return this.container.getAddress();
  }
}

module.exports = BaseInstance;
