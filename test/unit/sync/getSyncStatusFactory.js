const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const SyncState = require('../../../lib/sync/state/SyncState');
const SyncInfo = require('../../../lib/sync/SyncInfo');
const ChainInfo = require('../../../lib/blockchain/ChainInfo');
const getSyncStatusFactory = require('../../../lib/sync/getSyncStatusFactory');

describe('getSyncStatusFactory', () => {
  const blocks = getBlockFixtures();
  const getSyncStatus = getSyncStatusFactory();

  it('should be INITIAL_SYNC if SyncState has not lastSyncAt', async () => {
    const syncState = new SyncState([], null);

    const syncStatus = await getSyncStatus(syncState);
    expect(syncStatus).to.be.equal(SyncInfo.STATUSES.INITIAL_SYNC);
  });

  it('should be SYNCING if SyncState has lastSyncAt and ChainInfo isBlockchainSynced is false', async () => {
    const syncState = new SyncState([], new Date());
    const lastChainBlock = blocks[0];
    const isBlockChainSynced = false;
    const chainInfo = new ChainInfo(lastChainBlock.height, lastChainBlock.hash, isBlockChainSynced);

    const syncStatus = await getSyncStatus(syncState, chainInfo);
    expect(syncStatus).to.be.equal(SyncInfo.STATUSES.SYNCING);
  });

  it('should be SYNCING if SyncState last block hash is different with ChainInfo last block hash', async () => {
    const syncStateLastBlock = blocks[0];
    const lastChainInfo = blocks[3];
    const syncState = new SyncState([syncStateLastBlock], new Date());
    const isBlockChainSynced = true;
    const chainInfo = new ChainInfo(lastChainInfo.height, lastChainInfo.hash, isBlockChainSynced);

    const syncStatus = await getSyncStatus(syncState, chainInfo);
    expect(syncStatus).to.be.equal(SyncInfo.STATUSES.SYNCING);
  });

  it('should be synced if ChainInfo isBlockchainSynced is true and SyncState last block hash is equal to ChainInfo last block hash', async () => {
    const syncStateLastBlock = blocks[3];
    const lastChainInfo = blocks[3];
    const syncState = new SyncState([syncStateLastBlock], new Date());
    const isBlockChainSynced = true;
    const chainInfo = new ChainInfo(lastChainInfo.height, lastChainInfo.hash, isBlockChainSynced);

    const syncStatus = await getSyncStatus(syncState, chainInfo);
    expect(syncStatus).to.be.equal(SyncInfo.STATUSES.SYNCED);
  });
});
