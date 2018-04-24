const DashCoreInstanceOptions = require('./DashCoreInstanceOptions');
const Network = require('../docker/Network');
const EcrRegistry = require('../docker/EcrRegistry');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const RpcClient = require('bitcoind-rpc-dash/promise');
const DashCoreInstance = require('./DashCoreInstance');

class DashCoreInstanceFactory {
  // eslint-disable-next-line class-methods-use-this
  create() {
    const options = new DashCoreInstanceOptions();
    const network = new Network(options);
    const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
    const image = new Image(options, registry);
    const container = new Container(options);
    return new DashCoreInstance(network, image, container, RpcClient);
  }
}

module.exports = new DashCoreInstanceFactory();
