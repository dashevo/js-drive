const Docker = require('dockerode');

const DashCoreInstanceOptions = require('../../../../lib/test/services/dashCore/DashCoreInstanceOptions');
const BaseInstance = require('../../../../lib/test/services/docker/BaseInstance');

describe('BaseInstance', function main() {
  this.timeout(40000);

  const options = new DashCoreInstanceOptions();

  describe('usage', () => {
    const instance = new BaseInstance(options);

    after(async () => instance.clean());

    it('should start a BaseInstance with DashCoreInstanceOptions network options', async () => {
      await instance.start();
      const network = new Docker().getNetwork(options.getNetworkName());
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal(options.getNetworkDriver());
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal(options.getNetworkName());
    });

    it('should start an instance with the DashCoreInstanceOptions options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal([
        `-port=${options.getMainPort()}`,
        `-rpcuser=${options.getRpcUser()}`,
        `-rpcpassword=${options.getRpcPassword()}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${options.getRpcPort()}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${options.getZmqPort()}`,
      ]);
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.details();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should return instance IP', () => {
      expect(instance.getIp()).to.be.equal(instance.getIp());
    });

    it('should clean the instance', async () => {
      await instance.clean();

      let error;
      try {
        await instance.container.details();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });
});
