const MongoDbInstanceOptions = require('./MongoDbInstanceOptions');
const Network = require('../docker/Network');
const EcrRegistry = require('../docker/EcrRegistry');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const BaseInstance = require('../docker/BaseInstance');

class MongoDbInstanceFactory {
  // eslint-disable-next-line class-methods-use-this
  create() {
    const options = new MongoDbInstanceOptions();
    const network = new Network(options);
    const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
    const image = new Image(options, registry);
    const container = new Container(options);
    return new BaseInstance(network, image, container);
  }
}

module.exports = new MongoDbInstanceFactory();
