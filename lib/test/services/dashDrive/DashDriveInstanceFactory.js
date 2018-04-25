const DashDriveInstanceOptions = require('./DashDriveInstanceOptions');
const Network = require('../docker/Network');
const EcrRegistry = require('../docker/EcrRegistry');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const BaseInstance = require('../docker/BaseInstance');

class DashDriveInstanceFactory {
  // eslint-disable-next-line class-methods-use-this
  async create({ ENV = [] } = {}) {
    const options = new DashDriveInstanceOptions({ envs: ENV });

    const { name: networkName, driver } = options.getNetworkOptions();
    const network = new Network(networkName, driver);

    const registry = new EcrRegistry(process.env.AWS_DEFAULT_REGION);
    const authorizationToken = await registry.getAuthorizationToken();

    const imageName = options.getImageName();
    const image = new Image(imageName, authorizationToken);

    const containerOptions = options.getContainerOptions();
    const container = new Container(networkName, imageName, containerOptions);

    return new BaseInstance(network, image, container, options);
  }
}

module.exports = new DashDriveInstanceFactory();
