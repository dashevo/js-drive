const DockerInstanceOptions = require('../docker/DockerInstanceOptions');

class MongoDbInstanceOptions extends DockerInstanceOptions {
  constructor() {
    super();

    const ipfsPort = this.getRandomPort(5001, 5998);
    this.ipfs = {
      port: ipfsPort,
    };
    const container = {
      image: 'ipfs/go-ipfs:v0.4.15',
      network: {
        name: 'dash_test_network',
        driver: 'bridge',
      },
      ports: [
        `${ipfsPort}:5001`,
      ],
    };
    this.container = { ...this.container, ...container };
  }

  regeneratePorts() {
    const ipfsPort = this.getRandomPort(5001, 5998);

    this.ipfs.port = ipfsPort;
    this.container.ports = [
      `${ipfsPort}:5001`,
    ];

    return this;
  }

  getIpfsPort() {
    return this.ipfs.port;
  }
}

module.exports = MongoDbInstanceOptions;
