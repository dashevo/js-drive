class Options {
  constructor() {
    this.ports = {};
    this.cmd = [];
    this.envs = [];
    this.ports = {};
    this.networks = {};
  }

  getOptions() {
    return this;
  }

  getEnvs() {
    return this.envs || [];
  }

  getCommand() {
    return this.cmd;
  }

  getPorts() {
    return this.ports || {};
  }

  getMainPort() {
    return this.ports.MAIN_PORT;
  }

  getRpcUser() {
    return this.rpc.user;
  }

  getNetworkName() {
    return this.network.name;
  }

  getNetworkDriver() {
    return this.network.driver;
  }

  getImageName() {
    return this.image.name;
  }

  getImageAuthorization() {
    return this.image.authorization;
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = Options;
