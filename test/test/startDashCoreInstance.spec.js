const { expect } = require('chai');
const Docker = require('dockerode');

const startDashCoreInstance = require('../../lib/test/startDashCoreInstance');

async function stopRunningContainers() {
  const docker = new Docker();
  const containers = await docker.listContainers();

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    await docker.getContainer(container.Id).stop();
  }
}

describe('startDashCoreInstance', function main() {
  this.timeout(20000);

  before(async () => stopRunningContainers());

  describe('One instance', () => {
    let instance;

    before(async () => {
      instance = await startDashCoreInstance();
    });
    after(async () => {
      await instance.clean();
    });

    it('should has container running', async () => {
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should has RPC connected', async () => new Promise((resolve) => {
      setTimeout(async () => {
        const { result } = await instance.rpcClient.getinfo();
        expect(result.version).to.equal(120300);
        resolve();
      }, 5000);
    }));
  });

  describe('Three instances', () => {
    let instances;

    before(async () => {
      instances = await startDashCoreInstance.many(3);
    });
    after(async () => {
      const promises = instances.map(instance => instance.clean());
      await Promise.all(promises);
    });

    it('should have containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].container.inspect();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have RPCs connected', async () => new Promise((resolve) => {
      setTimeout(async () => {
        for (let i = 0; i < 3; i++) {
          const { result } = await instances[i].rpcClient.getinfo();
          expect(result.version).to.equal(120300);
        }
        resolve();
      }, 10000);
    }));
  });
});
