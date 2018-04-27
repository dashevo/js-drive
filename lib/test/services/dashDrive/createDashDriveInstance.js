const DashDriveInstanceOptions = require('./DashDriveInstanceOptions');
const Network = require('../docker/Network');
const EcrRegistry = require('../docker/EcrRegistry');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const DockerInstance = require('../docker/DockerInstance');

async function createDashDriveInstance(envs) {
  const options = new DashDriveInstanceOptions({ envs });

  const { name: networkName, driver } = options.getNetworkOptions();
  const network = new Network(networkName, driver);

  const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
  const authorizationToken = await registry.getAuthorizationToken();

  const imageName = options.getContainerImageName();
  const image = new Image(imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DockerInstance(network, image, container, options);
}

module.exports = createDashDriveInstance;
