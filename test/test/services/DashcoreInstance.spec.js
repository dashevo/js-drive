const { expect } = require('chai');
const Docker = require('dockerode');

const DashcoreInstance = require('../../../lib/test/services/DashcoreInstance');

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

  before(async () => stopRunningContainers());

  describe('instance', () => {
    it('should create an instance with the default options', () => {
      const instance = new DashcoreInstance();
      expect(instance.options).to.deep.equal(DashcoreInstance.DEFAULT_OPTIONS);
    });

    it('should create an instance with custom RPC options', () => {
      const options = {
        RPC: {
          port: 20002,
          user: 'test',
          password: 'integration',
        },
      };
      const instance = new DashcoreInstance(options);
      const expected = Object.assign({}, DashcoreInstance.DEFAULT_OPTIONS, options);
      expect(instance.options).to.deep.equal(expected);
    });

    it('should create an instance with custom ZMQ options', () => {
      const options = {
        ZMQ: {
          port: 50002,
        },
      };
      const instance = new DashcoreInstance(options);
      const expected = Object.assign({}, DashcoreInstance.DEFAULT_OPTIONS, options);
      expect(instance.options).to.deep.equal(expected);
    });
  });

  describe('usage', () => {
    const instance = new DashcoreInstance();

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([
        `-rpcuser=${DashcoreInstance.DEFAULT_OPTIONS.RPC.user}`,
        `-rpcpassword=${DashcoreInstance.DEFAULT_OPTIONS.RPC.password}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${DashcoreInstance.DEFAULT_OPTIONS.RPC.port}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${DashcoreInstance.DEFAULT_OPTIONS.ZMQ.port}`,
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

  describe('errors', () => {
    const instanceOne = new DashcoreInstance();
    const instanceTwo = new DashcoreInstance();

    after(async () => {
      await Promise.all([
        instanceOne.clean(),
        instanceTwo.clean(),
      ]);
    });

    it('should throw exception if 2 instance start with the same options (ports)', async () => {
      try {
        await instanceOne.start();
        await instanceTwo.start();
      } catch (error) {
        expect(error.statusCode).to.equal(500);
        expect(error.reason).to.equal('server error');
      }
    });
  });

  describe('RPC', () => {
    const instance = new DashcoreInstance();

    after(async () => instance.clean());

    it('should work after starting the instance', async () => {
      await instance.start();

      return new Promise((resolve) => {
        setTimeout(async () => {
          const { result } = await instance.rpcClient.getinfo();
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
          const { result } = await instance.rpcClient.getinfo();
          expect(result.version).to.equal(120300);
          resolve();
        }, 5000);
      });
    });
  });
});
