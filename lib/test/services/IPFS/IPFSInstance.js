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
    const addr = `/ip4/${ipfsInstance.getIp()}/tcp/${this.options.getIpfsExposedPort()}/ipfs/${externalIpfsId.id}`;
    await internalIpfs.swarm.connect(addr);
  }

  getIpfsAddress() {
    return `/ip4/${this.getIp()}/tcp/${this.options.getIpfsInternalPort()}`;
  }

  getApi() {
    return this.ipfsClient;
  }

  async initialization() {
    const address = `/ip4/127.0.0.1/tcp/${this.options.getIpfsExposedPort()}`;
    this.ipfsClient = await this.IpfsApi(address);

    let starting = true;
    while (starting) {
      try {
        await this.ipfsClient.swarm.peers();
        starting = false;
      } catch (error) {
        if (error && !this.isDaemonLoading(error)) {
          throw error;
        }
        await wait(1000);
      }
    }
  }

  isDaemonLoading(error) {
    const messages = [
      'socket hang up',
      'ECONNRESET',
    ];
    const loading = messages.filter(message => error.message.includes(message));
    return !!loading.length;
  }
}

module.exports = IPFSInstance;
