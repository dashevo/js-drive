const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const SyncState = require('../../../lib/sync/state/SyncState');
const SyncStatus = require('../../../lib/sync/SyncStatus');
const getDriveStatusFactory = require('../../../lib/sync/getDriveStatusFactory');

describe('getDriveStatusFactory', () => {
  let blocks;
  let rpcClient;
  let isDriveSynced;

  beforeEach(function beforeEach() {
    blocks = getBlockFixtures();
    rpcClient = {
      mnsync: this.sinon.stub(),
      getBlockCount: this.sinon.stub(),
      getBlockHash: this.sinon.stub(),
    };
    isDriveSynced = getDriveStatusFactory(rpcClient);
  });

  it('should not be synced if blockchain blocks is 0 and MN IsBlockchainSynced is false', async () => {
    rpcClient.getBlockCount.returns({ result: 0 });
    rpcClient.mnsync.returns({ result: { IsBlockchainSynced: false } });
    const syncState = new SyncState([], null);

    const driveSynced = await isDriveSynced(syncState);
    expect(driveSynced).to.be.equal(SyncStatus.STATUSES.INITIAL_SYNC);
  });

  it('should not be synced if blockchain blocks is > 0 and MN IsBlockchainSynced is false', async () => {
    rpcClient.getBlockCount.returns({ result: 10 });
    rpcClient.mnsync.returns({ result: { IsBlockchainSynced: false } });
    const syncState = new SyncState([], new Date());

    const driveSynced = await isDriveSynced(syncState);
    expect(driveSynced).to.be.equal(SyncStatus.STATUSES.SYNCING);
  });

  it('should not be synced if SyncState last block hash is different with blockchain last block hash', async () => {
    rpcClient.getBlockCount.returns({ result: blocks.length });
    rpcClient.mnsync.returns({ result: { IsBlockchainSynced: true } });
    const blockchainLastSyncedBlock = blocks[3];
    rpcClient.getBlockHash.returns({ result: blockchainLastSyncedBlock.hash });
    const driveLastSyncedBlock = blocks[0];
    const syncState = new SyncState([driveLastSyncedBlock], new Date());

    const driveSynced = await isDriveSynced(syncState);
    expect(driveSynced).to.be.equal(SyncStatus.STATUSES.SYNCING);
    expect(rpcClient.getBlockHash).to.be.calledOnce();
  });

  it('should be synced if MN IsBlockchainSynced is true and SyncState last block is equal to blockchain last block', async () => {
    rpcClient.getBlockCount.returns({ result: blocks.length });
    rpcClient.mnsync.returns({ result: { IsBlockchainSynced: true } });
    const blockchainLastSyncedBlock = blocks[3];
    rpcClient.getBlockHash.returns({ result: blockchainLastSyncedBlock.hash });
    const driveLastSyncedBlock = blocks[3];
    const syncState = new SyncState([driveLastSyncedBlock], new Date());

    const driveSynced = await isDriveSynced(syncState);
    expect(driveSynced).to.be.equal(SyncStatus.STATUSES.SYNCED);
    expect(rpcClient.getBlockHash).to.be.calledOnce();
  });
});
