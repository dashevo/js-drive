const SyncInfo = require('./SyncInfo');

/**
 * @param {SyncStateRepository} syncStateRepository
 * @param {getDriveStatus} getDriveStatus
 * @param {getLastBlock} getLastBlock
 * @returns {getSyncInfo}
 */
function getSyncInfoFactory(syncStateRepository, getDriveStatus, getLastBlock) {
  /**
   * @typedef getSyncInfo
   * @returns {Promise<SyncInfo>}
   */
  async function getSyncInfo() {
    const syncState = await syncStateRepository.fetch();
    const lastDriveBlock = syncState.getLastBlock();

    const status = await getDriveStatus(syncState);
    const lastChainBlock = await getLastBlock();

    return new SyncInfo(
      lastDriveBlock.height,
      lastDriveBlock.hash,
      syncState.getLastSyncAt(),
      lastChainBlock.height,
      lastChainBlock.hash,
      status,
    );
  }

  return getSyncInfo;
}

module.exports = getSyncInfoFactory;
