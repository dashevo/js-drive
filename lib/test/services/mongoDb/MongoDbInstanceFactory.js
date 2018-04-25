const MongoDbInstanceOptions = require('./MongoDbInstanceOptions');
const Network = require('../docker/Network');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const DockerInstance = require('../docker/DockerInstance');

class MongoDbInstanceFactory {
  // eslint-disable-next-line class-methods-use-this
  create() {
    const options = new MongoDbInstanceOptions();

    const { name: networkName, driver } = options.getNetworkOptions();
    const network = new Network(networkName, driver);

    const imageName = options.getImageName();
    const image = new Image(imageName);

    const containerOptions = options.getContainerOptions();
    const container = new Container(networkName, imageName, containerOptions);

    return new DockerInstance(network, image, container, options);
  }
}

module.exports = new MongoDbInstanceFactory();
