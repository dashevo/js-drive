const SyncStatus = require('../../../lib/sync/SyncStatus');
const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');

describe('SyncStatus', () => {
  const blocks = getBlockFixtures();

  it('should serialize SyncSatus', () => {
    const lastSyncedBlock = blocks[0];
    const lastChainBlock = blocks[3];
    const lastSyncAt = new Date();
    const status = 'sync';
    const syncStatus = new SyncStatus(
      lastSyncedBlock.height,
      lastSyncedBlock.hash,
      lastSyncAt,
      lastChainBlock.height,
      lastChainBlock.hash,
      status,
    );
    expect(syncStatus.toJSON()).to.be.deep.equal({
      lastSyncedBlockHeight: lastSyncedBlock.height,
      lastSyncedBlockHash: lastSyncedBlock.hash,
      lastSyncAt,
      currentBlockHeight: lastChainBlock.height,
      currentBlockHash: lastChainBlock.hash,
      status,
    });
  });
});
