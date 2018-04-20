const startDashDriveInstance = require('../../../../lib/test/services/dashDrive/startDashDriveInstance');

describe('startDashDriveInstance', function main() {
  this.timeout(40000);

  describe('One instance', () => {
    let instance;

    before(async () => {
      instance = await startDashDriveInstance();
    });

    it('should has MongoDb container running', async () => {
      const { State } = await instance.mongoDb.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container running', async () => {
      const { State } = await instance.dashDrive.container.details();
      expect(State.Status).to.equal('running');
    });

    it('should has DashDrive container has the right MongoDb address', async () => {
      const { Config: { Env } } = await instance.dashDrive.container.details();
      const expectedEnv = `STORAGE_MONGODB_URL=mongodb://${instance.mongoDb.getAddress()}`;
      const mongoAddressVariable = Env.filter(variable => variable === expectedEnv);
      expect(mongoAddressVariable.length).to.equal(1);
    });

    it('should be on the same network (DashDrive and MongoDb)', async () => {
      const {
        NetworkSettings: dashDriveNetworkSettings,
      } = await instance.dashDrive.container.details();
      const {
        NetworkSettings: mongoDbNetworkSettings,
      } = await instance.mongoDb.container.details();

      expect(Object.keys(dashDriveNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
      expect(Object.keys(mongoDbNetworkSettings.Networks)).to.deep.equal(['dash_test_network']);
    });
  });

  describe('Three instance', () => {
    let instances;

    before(async () => {
      instances = await startDashDriveInstance.many(3);
    });

    it('should have MongoDb containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].mongoDb.container.details();
        expect(State.Status).to.equal('running');
      }
    });

    it('should have DashDrive containers running', async () => {
      for (let i = 0; i < 3; i++) {
        const { State } = await instances[i].dashDrive.container.details();
        expect(State.Status).to.equal('running');
      }
    });
  });
});
