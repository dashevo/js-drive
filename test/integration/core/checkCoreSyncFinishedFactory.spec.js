const { startMongoDb, startDashCore } = require('@dashevo/dp-services-ctl');

const createTestDIContainer = require('../../../lib/test/createTestDIContainer');

describe('checkCoreSyncFinishedFactory', function main() {
  this.timeout(90000);

  let mongoDB;
  let firstDashCore;
  let container;
  let checkCoreSyncFinished;

  before(async () => {
    mongoDB = await startMongoDb();
    firstDashCore = await startDashCore();
    await firstDashCore.getApi().generate(10000);
  });

  after(async () => {
    await mongoDB.remove();
  });

  afterEach(async () => {
    if (container) {
      await container.dispose();
    }
  });

  it('should wait until Dash Core is synced', async () => {
    const secondDashCore = await startDashCore();
    await secondDashCore.connect(firstDashCore);

    container = await createTestDIContainer(mongoDB, secondDashCore);
    checkCoreSyncFinished = container.resolve('checkCoreSyncFinished');

    await checkCoreSyncFinished();
  });
});
