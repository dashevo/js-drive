const Docker = require('dockerode');

const DashDriveInstanceFactory = require('../../../../lib/test/services/dashDrive/DashDriveInstanceFactory');

describe('DashDriveInstanceFactory', function main() {
  this.timeout(90000);

  describe('usage', () => {
    const ENV = [
      'STORAGE_MONGODB_URL=mongodb://127.0.0.1',
    ];

    let instance;
    before(async () => {
      instance = await DashDriveInstanceFactory.create({
        ENV,
      });
    });
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

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.details();

      const instanceEnv = Env.filter(variable => ENV.includes(variable));
      expect(ENV.length).to.deep.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal(['run', 'sync']);
    });
  });
});
