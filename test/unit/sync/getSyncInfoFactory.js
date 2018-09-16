const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const SyncState = require('../../../lib/sync/state/SyncState');
const SyncInfo = require('../../../lib/sync/SyncInfo');
const ChainInfo = require('../../../lib/blockchain/ChainInfo');
const getSyncInfoFactory = require('../../../lib/sync/getSyncInfoFactory');

describe('getSyncInfoFactory', () => {
  let blocks;
  let syncStateRepository;
  let getSyncStatus;
  let getChainInfo;
  let lastChainBlock;
  let getSyncInfo;

  beforeEach(function beforeEach() {
    blocks = getBlockFixtures();
    [, , lastChainBlock] = blocks;
    syncStateRepository = {
      fetch: this.sinon.stub(),
    };
    getSyncStatus = this.sinon.stub();
    getChainInfo = this.sinon.stub();
    const isBlockchainSynced = true;
    const chainInfo = new ChainInfo(lastChainBlock.height, lastChainBlock.hash, isBlockchainSynced);
    getChainInfo.returns(chainInfo);
    getSyncInfo = getSyncInfoFactory(syncStateRepository, getChainInfo, getSyncStatus);
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
    it('should be initialSync if getSyncStatus returns INITIAL_SYNC', async () => {
      const syncStateLastSyncAt = null;
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getSyncStatus.returns(SyncInfo.STATUSES.INITIAL_SYNC);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getStatus()).to.be.deep.equal(SyncInfo.STATUSES.INITIAL_SYNC);
    });

    it('should be syncing if getSyncStatus returns SYNCING', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getSyncStatus.returns(SyncInfo.STATUSES.SYNCING);
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getStatus()).to.be.deep.equal(SyncInfo.STATUSES.SYNCING);
    });

    it('should be synced if getSyncStatus returns SYNCED', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      getSyncStatus.returns(SyncInfo.STATUSES.SYNCED);
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

  describe('lastChainBlockHeight', () => {
    it('should be the same block hash as the one returned by getChainInfo', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const chainLastBlock = blocks[blocks.length - 1];
      const isBlockchainSynced = true;
      getChainInfo.returns(new ChainInfo(
        chainLastBlock.height,
        chainLastBlock.hash,
        isBlockchainSynced,
      ));
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastChainBlockHeight()).to.be.deep.equal(chainLastBlock.height);
    });
  });

  describe('lastChainBlockHash', () => {
    it('should be the same block height as the one returned by getChainInfo', async () => {
      const syncStateLastSyncAt = new Date();
      const syncState = new SyncState(blocks, syncStateLastSyncAt);
      syncStateRepository.fetch.returns(syncState);
      const chainLastBlock = blocks[blocks.length - 1];
      const isBlockchainSynced = true;
      getChainInfo.returns(new ChainInfo(
        chainLastBlock.height,
        chainLastBlock.hash,
        isBlockchainSynced,
      ));
      const syncInfo = await getSyncInfo();
      expect(syncInfo.getLastChainBlockHash()).to.be.deep.equal(chainLastBlock.hash);
    });
  });
});
