const getBlockFixtures = require('../../../../lib/test/fixtures/getBlockFixtures');
const SyncInfo = require('../../../../lib/sync/SyncInfo');
const getSyncStatusMethodFactory = require('../../../../lib/api/methods/getSyncStatusMethodFactory');

describe('getSyncStatusMethodFactory', () => {
  let getSyncStatus;
  let getSyncStatusMethod;
  const blocks = getBlockFixtures();

  beforeEach(function beforeEach() {
    getSyncStatus = this.sinon.stub();
    getSyncStatusMethod = getSyncStatusMethodFactory(getSyncStatus);
  });

  it('should throw an error if getSyncStatus fails', async () => {
    getSyncStatus.throws(new Error());
    expect(getSyncStatusMethod()).to.be.rejectedWith(Error);
  });

  it('should return Sync Status', async () => {
    const lastSyncedBlock = blocks[0];
    const lastChainBlock = blocks[3];
    const lastSyncAt = new Date();
    const status = 'sync';
    const syncStatus = new SyncInfo(
      lastSyncedBlock.height,
      lastSyncedBlock.hash,
      lastSyncAt,
      lastChainBlock.height,
      lastChainBlock.hash,
      status,
    );
    getSyncStatus.returns(syncStatus);
    const syncStatusData = await getSyncStatusMethod();
    expect(syncStatusData).to.be.deep.equal({
      lastSyncedBlockHeight: lastSyncedBlock.height,
      lastSyncedBlockHash: lastSyncedBlock.hash,
      lastSyncAt,
      currentBlockHeight: lastChainBlock.height,
      currentBlockHash: lastChainBlock.hash,
      status,
    });
  });
});

