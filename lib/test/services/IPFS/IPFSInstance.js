const DockerInstance = require('../docker/DockerInstance');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class IPFSInstance extends DockerInstance {
  constructor(network, image, container, IpfsApi, options) {
    super(network, image, container, options);
    this.IpfsApi = IpfsApi;
    this.options = options;
  }

  async start() {
    await super.start();
    await this.initialization();
  }

  async connect(ipfsInstance) {
    const externalIpfs = ipfsInstance.getApi();
    const externalIpfsId = await externalIpfs.id();
    const internalIpfs = this.getApi();
    const addr = `/ip4/${ipfsInstance.getIp()}/tcp/${this.options.getIpfsPort()}/ipfs/${externalIpfsId.id}`;
    await internalIpfs.swarm.connect(addr);
  }

  getIpfsAddress() {
    return `/ip4/${this.getIp()}/tcp/${this.options.getIpfsPort()}`;
  }

  getApi() {
    return this.ipfsClient;
  }

  async initialization() {
    const address = `/ip4/127.0.0.1/tcp/${this.options.getIpfsPort()}`;
    this.ipfsClient = await this.IpfsApi(address);

    let starting = true;
    while (starting) {
      try {
        await this.ipfsClient.swarm.peers();
        starting = false;
      } catch (error) {
        if (error && error.message !== 'socket hang up') {
          throw error;
        }
        await wait(1000);
      }
    }
  }
}

module.exports = IPFSInstance;
