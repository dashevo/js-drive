const Options = require('../docker/Options');

class MongoDbInstanceOptions extends Options {
  constructor() {
    super();

    this.image = {
      name: 'mongo:3.6',
      authorization: false,
    };
    this.ports = {};
    this.cmd = [];
    this.network = {
      name: 'dash_test_network',
      driver: 'bridge',
    };
  }
}

module.exports = MongoDbInstanceOptions;
