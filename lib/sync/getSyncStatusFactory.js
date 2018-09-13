const SyncStatus = require('./SyncStatus');

/**
 * @param {SyncStateRepository} syncStateRepository
 * @param {getDriveStatus} getDriveStatus
 * @param {getLastBlock} getLastBlock
 * @returns {getSyncStatus}
 */
function getSyncStatusFactory(syncStateRepository, getDriveStatus, getLastBlock) {
  /**
   * @typedef getSyncStatus
   * @returns {Promise<SyncStatus>}
   */
  async function getSyncStatus() {
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

  return getSyncStatus;
}

module.exports = getSyncStatusFactory;
