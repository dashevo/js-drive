const SyncStatus = require('./SyncStatus');

/**
 * @param {SyncStateRepository} syncStateRepository
 * @param {getDriveStatus} getDriveStatus
 * @param {getLastBlock} getLastBlock
 * @returns {getSyncInfo}
 */
function getSyncInfoFactory(syncStateRepository, getDriveStatus, getLastBlock) {
  /**
   * @typedef getSyncInfo
   * @returns {Promise<SyncStatus>}
   */
  async function getSyncInfo() {
    const syncState = syncStateRepository.fetch();
    const lastDriveBlock = syncState.getLastBlock();

    const status = await getDriveStatus(syncState);
    const lastChainBlock = await getLastBlock();

    return new SyncStatus(
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
