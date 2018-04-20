class MongoDbInstanceOptions {
  constructor() {
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

  generate() {
    return this;
  }
}

module.exports = MongoDbInstanceOptions;
