const MongoDbInstanceOptions = require('./MongoDbInstanceOptions');
const Network = require('../docker/Network');
const Image = require('../docker/Image');
const Container = require('../docker/Container');
const { MongoClient } = require('mongodb');
const MongoDbInstance = require('./MongoDbInstance');
const Docker = require('dockerode');

/**
 * Create MongoDb instance
 *
 * @returns {Promise<DockerInstance>}
 */
async function createMongoDbInstance() {
  const options = new MongoDbInstanceOptions();

  const docker = new Docker();

  const { name: networkName, driver } = options.getContainerNetworkOptions();
  const network = new Network(docker, networkName, driver);

  const imageName = options.getContainerImageName();
  const image = new Image(docker, imageName);

  const containerOptions = options.getContainerOptions();
  const container = new Container(docker, networkName, imageName, containerOptions);

  return new MongoDbInstance(network, image, container, MongoClient, options);
}

module.exports = createMongoDbInstance;
