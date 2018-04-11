const sinon = require('sinon');
const { expect } = require('chai');
const Docker = require('dockerode');

const DashCoreInstance = require('../../../lib/test/services/DashCoreInstance');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pruneNetworks() {
  const docker = new Docker();
  await docker.pruneNetworks();
}

async function stopRunningContainers() {
  const docker = new Docker();
  const containers = await docker.listContainers();

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    await docker.getContainer(container.Id).stop();
  }
}

describe('DashCoreInstance', function main() {
  this.timeout(20000);

  before(async () => pruneNetworks());
  before(async () => stopRunningContainers());

  describe('usage', () => {
    const instance = new DashCoreInstance();

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([
        `-port=${instance.options.CORE.port}`,
        `-rpcuser=${instance.options.RPC.user}`,
        `-rpcpassword=${instance.options.RPC.password}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${instance.options.RPC.port}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${instance.options.ZMQ.port}`,
      ]);
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should return ZMQ sockets configuration', () => {
      const zmqPort = instance.options.ZMQ.port;
      const zmqSockets = instance.getZmqSockets();
      expect(zmqSockets).to.deep.equal({
        hashblock: `tcp://127.0.0.1:${zmqPort}`,
      });
    });

    it('should return RPC client', () => {
      const rpcPort = instance.options.RPC.port;
      const rpcClient = instance.getApi();
      expect(rpcClient.host).to.be.equal('127.0.0.1');
      expect(rpcClient.port).to.be.equal(rpcPort);
    });

    it('should return container IP', () => {
      expect(instance.getIp()).to.be.equal(instance.containerIp);
    });

    it('should clean the instance', async () => {
      await instance.clean();

      return new Promise(async (resolve) => {
        try {
          await instance.container.inspect();
        } catch (error) {
          expect(error.statusCode).to.equal(404);
          expect(error.reason).to.equal('no such container');
          resolve();
        }
      });
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

    it('should propagate block from one instance to the other', async () => {
      const { result: blocksInstanceOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksInstanceTwo } = await instanceTwo.rpcClient.getBlockCount();
      expect(blocksInstanceOne).to.equal(0);
      expect(blocksInstanceTwo).to.equal(0);

      await instanceOne.rpcClient.generate(2);

      const { result: blocksOne } = await instanceOne.rpcClient.getBlockCount();
      const { result: blocksTwo } = await instanceTwo.rpcClient.getBlockCount();
      expect(blocksOne).to.equal(2);
      expect(blocksTwo).to.equal(2);
    });
  });

  describe('ports', () => {
    const instanceOne = new DashCoreInstance();
    const instanceTwo = new DashCoreInstance();
    const instanceThree = new DashCoreInstance();

    const sandbox = sinon.sandbox.create();

    afterEach(() => sandbox.restore());
    after(async () => {
      await Promise.all([
        instanceOne.clean(),
        instanceTwo.clean(),
        instanceThree.clean(),
      ]);
    });

    it('should retry start container with another port if it is busy', async () => {
      instanceTwo.options = instanceOne.options;
      instanceThree.options = instanceOne.options;
      const instanceThreeSpy = sandbox.spy(instanceThree, 'createContainer');

      await instanceOne.start();
      await instanceTwo.start();
      await instanceThree.start();

      expect(instanceThreeSpy.callCount).to.be.equal(2);
    });
  });

  describe('RPC', () => {
    const instance = new DashCoreInstance();

    after(async () => instance.clean());

    it('should work after starting the instance', async () => {
      await instance.start();

      return new Promise((resolve) => {
        setTimeout(async () => {
          const rpcClient = instance.getApi();
          const { result } = await rpcClient.getinfo();
          expect(result.version).to.equal(120300);
          resolve();
        }, 5000);
      });
    });

    it('should work after restarting the instance', async () => {
      await instance.start();
      await instance.stop();
      await instance.start();

      return new Promise((resolve) => {
        setTimeout(async () => {
          const rpcClient = instance.getApi();
          const { result } = await rpcClient.getinfo();
          expect(result.version).to.equal(120300);
          resolve();
        }, 5000);
      });
    });
  });
});
