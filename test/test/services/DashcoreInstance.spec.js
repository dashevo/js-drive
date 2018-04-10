const sinon = require('sinon');
const { expect } = require('chai');
const Docker = require('dockerode');

const DashcoreInstance = require('../../../lib/test/services/DashcoreInstance');

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

describe('DashcoreInstance', function main() {
  this.timeout(20000);

  before(async () => pruneNetworks());
  before(async () => stopRunningContainers());

  describe('usage', () => {
    const instance = new DashcoreInstance();

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const { Driver } = await instance.network.inspect();
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

  describe('container ports', () => {
    const instanceOne = new DashcoreInstance();
    const instanceTwo = new DashcoreInstance();
    const instanceThree = new DashcoreInstance();

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
    const instance = new DashcoreInstance();

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
