const MongoDbInstanceOptions = require('./MongoDbInstanceOptions');
const Network = require('../docker/Network');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const DockerInstance = require('../docker/DockerInstance');

async function createMongoDbInstance() {
  const options = new MongoDbInstanceOptions();

  const { name: networkName, driver } = options.getNetworkOptions();
  const network = new Network(networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(networkName, imageName, containerOptions);

  return new DockerInstance(network, image, container, options);
}

module.exports = createMongoDbInstance;
