const { startMongoDb, startDashCore } = require('@dashevo/dp-services-ctl');

const createTestDIContainer = require('../../../lib/test/createTestDIContainer');

describe('waitReplicaSetInitializeFactory', function main() {
  this.timeout(90000);

  let mongoDB;
  let dashCore;

  before(async () => {
    mongoDB = await startMongoDb();
    dashCore = await startDashCore();
  });

  after(async () => {
    await mongoDB.remove();
  });

  it('should wait until mongodb replica set is initialed', async () => {
    await createTestDIContainer(mongoDB, dashCore);

    const status = await mongoDB.getClient().db('test')
      .admin()
      .command({ replSetGetStatus: 1 });

    const isInitialized = status && status.members && status.members[0] && status.members[0].stateStr === 'PRIMARY';
    expect(isInitialized).to.be.true();
  });
});
