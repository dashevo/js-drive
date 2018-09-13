const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const SyncState = require('../../../lib/sync/state/SyncState');
const SyncStatus = require('../../../lib/sync/SyncStatus');
const getSyncStatusFactory = require('../../../lib/sync/getSyncStatusFactory');

describe('getSyncStatusFactory', () => {
  let blocks;
  let syncStateRepository;
  let getDriveStatus;
  let getLastBlock;
  let lastChainBlock;
  let getSyncStatus;

  beforeEach(function beforeEach() {
    blocks = getBlockFixtures();
    [, , lastChainBlock] = blocks;
    syncStateRepository = {
      fetch: this.sinon.stub(),
    };
    getDriveStatus = this.sinon.stub();
    getLastBlock = this.sinon.stub();
    getLastBlock.returns(lastChainBlock);
    getSyncStatus = getSyncStatusFactory(syncStateRepository, getDriveStatus, getLastBlock);
  });

  describe('lastSyncAt', () => {
    it('should be null if SyncState does not have lastSyncAt', async () => {
      const syncStateLastSyncAt = null;
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getLastSyncAt()).to.be.deep.equal(syncStateLastSyncAt);
    });

    it('should be equal to SyncState lastSyncAt', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getLastSyncAt()).to.be.deep.equal(syncStateLastSyncAt);
    });
  });

  describe('status', () => {
    it('should be initialSync if SyncState lastSyncAt is null and DashDrive is not synced', async () => {
      const syncStateLastSyncAt = null;
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncStatus.STATUSES.INITIAL_SYNC);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getStatus()).to.be.deep.equal(SyncStatus.STATUSES.INITIAL_SYNC);
    });

    it('should be sync if SyncState has lastSyncAt and DashDrive is not synced', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncStatus.STATUSES.SYNCING);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getStatus()).to.be.deep.equal(SyncStatus.STATUSES.SYNCING);
    });

    it('should be synced if SyncState has lastSyncAt and DashDrive is synced', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncStatus.STATUSES.SYNCED);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getStatus()).to.be.deep.equal(SyncStatus.STATUSES.SYNCED);
    });
  });

  describe('lastSyncedBlockHeight', () => {
    it('should be the same block height as in SyncState', async () => {
      const syncStateLastSyncAt = new Date();
      const lastSyncedBlock = blocks[blocks.length - 1];
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getLastSyncedBlockHeight()).to.be.deep.equal(lastSyncedBlock.height);
    });
  });

  describe('lastSyncedBlockHash', () => {
    it('should be the same block hash as in SyncState', async () => {
      const syncStateLastSyncAt = new Date();
      const lastSyncedBlock = blocks[blocks.length - 1];
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getLastSyncedBlockHash()).to.be.deep.equal(lastSyncedBlock.hash);
    });
  });

  describe('currentBlockHeight', () => {
    it('should be the same block hash as the one returned by getLastBlock', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const currentBlockHeight = blocks[blocks.length - 1];
      getLastBlock.returns(currentBlockHeight);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getCurrentBlockHeight()).to.be.deep.equal(currentBlockHeight.height);
    });
  });

  describe('currentBlockHash', () => {
    it('should be the same block height as the one returned by getLastBlock', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const currentBlockHeight = blocks[blocks.length - 1];
      getLastBlock.returns(currentBlockHeight);
      const syncStatus = await getSyncStatus();
      expect(syncStatus.getCurrentBlockHash()).to.be.deep.equal(currentBlockHeight.hash);
    });
  });
});
