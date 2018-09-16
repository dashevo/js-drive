const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const SyncState = require('../../../lib/sync/state/SyncState');
const SyncInfo = require('../../../lib/sync/SyncInfo');
const getSyncInfoFactory = require('../../../lib/sync/getSyncInfoFactory');

describe('getSyncInfoFactory', () => {
  let blocks;
  let syncStateRepository;
  let getDriveStatus;
  let getLastBlock;
  let lastChainBlock;
  let getSyncInfo;

  beforeEach(function beforeEach() {
    blocks = getBlockFixtures();
    [, , lastChainBlock] = blocks;
    syncStateRepository = {
      fetch: this.sinon.stub(),
    };
    getDriveStatus = this.sinon.stub();
    getLastBlock = this.sinon.stub();
    getLastBlock.returns(lastChainBlock);
    getSyncInfo = getSyncInfoFactory(syncStateRepository, getDriveStatus, getLastBlock);
  });

  describe('lastSyncAt', () => {
    it('should be null if SyncState does not have lastSyncAt', async () => {
      const syncStateLastSyncAt = null;
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastSyncAt()).to.be.deep.equal(syncStateLastSyncAt);
    });

    it('should be equal to SyncState lastSyncAt', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastSyncAt()).to.be.deep.equal(syncStateLastSyncAt);
    });
  });

  describe('status', () => {
    it('should be initialSync if SyncState lastSyncAt is null and DashDrive is not synced', async () => {
      const syncStateLastSyncAt = null;
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncInfo.STATUSES.INITIAL_SYNC);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getStatus()).to.be.deep.equal(SyncInfo.STATUSES.INITIAL_SYNC);
    });

    it('should be sync if SyncState has lastSyncAt and DashDrive is not synced', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncInfo.STATUSES.SYNCING);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getStatus()).to.be.deep.equal(SyncInfo.STATUSES.SYNCING);
    });

    it('should be synced if SyncState has lastSyncAt and DashDrive is synced', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getDriveStatus.returns(SyncInfo.STATUSES.SYNCED);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getStatus()).to.be.deep.equal(SyncInfo.STATUSES.SYNCED);
    });
  });

  describe('lastSyncedBlockHeight', () => {
    it('should be the same block height as in SyncState', async () => {
      const syncStateLastSyncAt = new Date();
      const lastSyncedBlock = blocks[blocks.length - 1];
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastSyncedBlockHeight()).to.be.deep.equal(lastSyncedBlock.height);
    });
  });

  describe('lastSyncedBlockHash', () => {
    it('should be the same block hash as in SyncState', async () => {
      const syncStateLastSyncAt = new Date();
      const lastSyncedBlock = blocks[blocks.length - 1];
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastSyncedBlockHash()).to.be.deep.equal(lastSyncedBlock.hash);
    });
  });

  describe('currentBlockHeight', () => {
    it('should be the same block hash as the one returned by getLastBlock', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const currentBlockHeight = blocks[blocks.length - 1];
      getLastBlock.returns(currentBlockHeight);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getCurrentBlockHeight()).to.be.deep.equal(currentBlockHeight.height);
    });
  });

  describe('currentBlockHash', () => {
    it('should be the same block height as the one returned by getLastBlock', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const currentBlockHeight = blocks[blocks.length - 1];
      getLastBlock.returns(currentBlockHeight);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getCurrentBlockHash()).to.be.deep.equal(currentBlockHeight.hash);
    });
  });
});
