const DashCoreInstanceOptions = require('./DashCoreInstanceOptions');
const Network = require('../docker/Network');
const EcrRegistry = require('../docker/EcrRegistry');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const RpcClient = require('bitcoind-rpc-dash/promise');
const DashCoreInstance = require('./DashCoreInstance');

async function createDashCoreInstance() {
  const options = new DashCoreInstanceOptions();

  const { name: networkName, driver } = options.getNetworkOptions();
  const network = new Network(networkName, driver);

  const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
  const authorizationToken = await registry.getAuthorizationToken();

  const imageName = options.getImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DashCoreInstance(network, image, container, RpcClient, options);
}

module.exports = createDashCoreInstance;
