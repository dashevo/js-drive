const getRandomPort = require('../../instance/getRandomPort');

class MongoDbInstanceOptions {
  constructor() {
    this.image = {
      name: 'mongo:3.6',
      authorization: false,
    };
    this.cmd = [];
    this.ports = {
      MAIN_PORT: getRandomPort(50002, 59998),
    };
    this.network = {
      name: 'dash_test_network',
      driver: 'brigde',
    };
  }

  generate() {
    this.ports = {
      MAIN_PORT: getRandomPort(50002, 59998),
    };
    return this;
  }
}

module.exports = MongoDbInstanceOptions;
