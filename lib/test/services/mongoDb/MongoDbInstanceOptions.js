const Options = require('../docker/Options');

class MongoDbInstanceOptions extends Options {
  constructor() {
    super();

    const container = {
      image: 'mongo:3.6',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
    };
    this.container = Object.assign({}, this.container, container);
  }
}

module.exports = MongoDbInstanceOptions;
