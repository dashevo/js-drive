const DashDriveInstanceOptions = require('./DashDriveInstanceOptions');
const Network = require('../docker/Network');
const getAwsEcrAuthorizationToken = require('../docker/getAwsEcrAuthorizationToken');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const DockerInstance = require('../docker/DockerInstance');
const Docker = require('dockerode');

/**
 * Create DashDrive instance
 *
 * @param {Array} envs
 * @returns {Promise<DockerInstance>}
 */
async function createDashDriveInstance(envs) {
  const options = new DashDriveInstanceOptions({ envs });

  const docker = new Docker();

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(docker, networkName, driver);

  const authorizationToken = await getAwsEcrAuthorizationToken(process.env.AWS_DEFAULT_REGION);

  const imageName = options.getContainerImageName();
  const image = new Image(docker, imageName, authorizationToken);

  const containerOptions = options.getContainerOptions();
  const container = new Container(docker, networkName, imageName, containerOptions);

  return new DockerInstance(network, image, container, options);
}

module.exports = createDashDriveInstance;
