const SyncInfo = require('./SyncInfo');

/**
 * @param {SyncStateRepository} syncStateRepository
 * @param {getChainInfo} getChainInfo
 * @param {getSyncStatus} getSyncStatus
 * @returns {getSyncInfo}
 */
function getSyncInfoFactory(syncStateRepository, getChainInfo, getSyncStatus) {
  /**
   * @typedef getSyncInfo
   * @returns {Promise<SyncInfo>}
   */
  async function getSyncInfo() {
    const syncState = await syncStateRepository.fetch();
    const lastDriveBlock = syncState.getLastBlock();
    const chainInfo = await getChainInfo();

    const status = await getSyncStatus(syncState, chainInfo);

    return new SyncInfo(
      lastDriveBlock.height,
      lastDriveBlock.hash,
      syncState.getLastSyncAt(),
      chainInfo.getLastBlockHeight(),
      chainInfo.getLastBlockHash(),
      status,
    );
  }

  return getSyncInfo;
}

module.exports = getSyncInfoFactory;
