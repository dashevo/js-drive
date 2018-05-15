const DashCoreInstanceOptions = require('./DashCoreInstanceOptions');
const Network = require('../docker/Network');
const getAwsEcrAuthorizationToken = require('../docker/getAwsEcrAuthorizationToken');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const RpcClient = require('bitcoind-rpc-dash/promise');
const DashCoreInstance = require('./DashCoreInstance');
const Docker = require('dockerode');

/**
 * Create Dash Core instance
 *
 * @returns {Promise<DashCoreInstance>}
 */
async function createDashCoreInstance() {
  const options = new DashCoreInstanceOptions();

  const docker = new Docker();

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(docker, networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(process.env.AWS_DEFAULT_REGION);

  const imageName = options.getContainerImageName();
  const image = new Image(docker, imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(docker, networkName, imageName, containerOptions);

  return new DashCoreInstance(network, image, container, RpcClient, options);
}

module.exports = createDashCoreInstance;
