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
    const { result: randomAddress } = await firstDashCore.getApi().getNewAddress();
    await firstDashCore.getApi().generateToAddress(1000, randomAddress);
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

    let blockHeight = 0;
    let headerHeight = 0;
    await checkCoreSyncFinished((currentBlockHeight, currentHeaderCount) => {
      blockHeight = currentBlockHeight;
      headerHeight = currentHeaderCount;
    });

    expect(blockHeight).to.equal(1000);
    expect(headerHeight).to.equal(1000);
  });
});
