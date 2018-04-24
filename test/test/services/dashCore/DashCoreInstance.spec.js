const Docker = require('dockerode');

const DashCoreInstance = require('../../../../lib/test/services/dashCore/DashCoreInstance');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('DashCoreInstance', function main() {
  this.timeout(40000);

  describe('before start', () => {
    const instance = new DashCoreInstance();

    it('should throw an error if connect', async () => {
      const instanceTwo = new DashCoreInstance();

      let error;
      try {
        await instance.connect(instanceTwo);
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('Instance should be started before!');
    });

    it('should return empty object if getApi', () => {
      const api = instance.getApi();
      expect(api).to.deep.equal({});
    });

    it('should return empty object if getZmqSocket', () => {
      const config = instance.getZmqSockets();
      expect(config).to.deep.equal({});
    });
  });

  describe('usage', () => {
    const instance = new DashCoreInstance();

    after(async () => instance.clean());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal([
        `-port=${instance.options.ports.MAIN_PORT}`,
        `-rpcuser=${instance.options.rpc.user}`,
        `-rpcpassword=${instance.options.rpc.password}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${instance.options.ports.RPC}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${instance.options.ports.ZMQ}`,
      ]);
    });

    it('should return ZMQ sockets configuration', () => {
      const zmqPort = instance.options.ports.ZMQ;
      const zmqSockets = instance.getZmqSockets();
      expect(zmqSockets).to.deep.equal({
        hashblock: `tcp://127.0.0.1:${zmqPort}`,
      });
    });

    it('should return RPC client', () => {
      const rpcPort = instance.options.ports.RPC;
      const rpcClient = instance.getApi();
      expect(rpcClient.host).to.be.equal('127.0.0.1');
      expect(rpcClient.port).to.be.equal(rpcPort);
    });
  });

  describe('networking', () => {
    const instanceOne = new DashCoreInstance();
    const instanceTwo = new DashCoreInstance();

    before(async () => {
      await Promise.all([
        instanceOne.start(),
        instanceTwo.start(),
      ]);
    });
    after(async () => {
      await Promise.all([
        instanceOne.clean(),
        instanceTwo.clean(),
      ]);
    });

    it('should be connected each other', async () => {
      await instanceOne.connect(instanceTwo);
      await wait(2000);

      const { result: peersInstanceOne } = await instanceOne.rpcClient.getPeerInfo();
      const { result: peersInstanceTwo } = await instanceTwo.rpcClient.getPeerInfo();
      const peerInstanceOneIp = peersInstanceOne[0].addr.split(':')[0];
      const peerInstanceTwoIp = peersInstanceTwo[0].addr.split(':')[0];

      expect(peersInstanceOne.length).to.equal(1);
      expect(peersInstanceTwo.length).to.equal(1);
      expect(peerInstanceOneIp).to.equal(instanceTwo.getIp());
      expect(peerInstanceTwoIp).to.equal(instanceOne.getIp());
    });

    it('should propagate blocks from one instance to the other', async () => {
      const { result: blocksInstanceOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksInstanceTwo } = await instanceTwo.rpcClient.getBlockCount();
      expect(blocksInstanceOne).to.equal(0);
      expect(blocksInstanceTwo).to.equal(0);

      await instanceOne.rpcClient.generate(2);
      await wait(2000);

      const { result: blocksOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksTwo } = await instanceTwo.rpcClient.getBlockCount();
      expect(blocksOne).to.equal(2);
      expect(blocksTwo).to.equal(2);
    });
  });

  describe('RPC', () => {
    const instance = new DashCoreInstance();

    after(async () => instance.clean());

    it('should work after starting the instance', async () => {
      await instance.start();

      const rpcClient = instance.getApi();
      const { result } = await rpcClient.getInfo();
      expect(result.version).to.equal(120300);
    });

    it('should work after restarting the instance', async () => {
      await instance.start();
      await instance.stop();
      await instance.start();

      const rpcClient = instance.getApi();
      const { result } = await rpcClient.getInfo();
      expect(result.version).to.equal(120300);
    });
  });
});
