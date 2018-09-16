const SyncInfo = require('../../../lib/sync/SyncInfo');
const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');

describe('SyncInfo', () => {
  const blocks = getBlockFixtures();

  it('should serialize SyncSatus', () => {
    const lastSyncedBlock = blocks[0];
    const lastChainBlock = blocks[3];
    const lastSyncAt = new Date();
    const status = 'sync';
    const syncInfo = new SyncInfo(
      lastSyncedBlock.height,
      lastSyncedBlock.hash,
      lastSyncAt,
      lastChainBlock.height,
      lastChainBlock.hash,
      status,
    );
    expect(syncInfo.toJSON()).to.be.deep.equal({
      lastSyncedBlockHeight: lastSyncedBlock.height,
      lastSyncedBlockHash: lastSyncedBlock.hash,
      lastSyncAt,
      lastChainBlockHeight: lastChainBlock.height,
      lastChainBlockHash: lastChainBlock.hash,
      status,
    });
  });
});
