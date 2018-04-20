const Docker = require('dockerode');
const MongoDbInstance = require('../../../../lib/test/services/mongoDb/MongoDbInstance');

describe('MongoDbInstance', function main() {
  this.timeout(40000);

  describe('before start', () => {
    const instance = new MongoDbInstance();

    it('should not crash if stop', async () => {
      await instance.stop();
    });

    it('should not crash if clean', async () => {
      await instance.clean();
    });

    it('should return null if getIp', () => {
      const ip = instance.getIp();
      expect(ip).to.be.null();
    });

    it('should return null if getAddress', () => {
      const address = instance.getAddress();
      expect(address).to.be.null();
    });
  });

  describe('usage', () => {
    const instance = new MongoDbInstance();

    after(async () => instance.clean());

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

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal([
        'mongod',
      ]);
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

    it('should return container IP', () => {
      expect(instance.getIp()).to.be.equal(instance.container.getIp());
    });

    it('should return container address', () => {
      expect(instance.getAddress()).to.be.equal(`${instance.container.getIp()}:${instance.container.options.ports.MAIN_PORT}`);
    });

    it('should clean the instance', async () => {
      await instance.clean();

      let error;
      try {
        await instance.container.inspect();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });
});
