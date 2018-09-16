const SyncInfo = require('./SyncInfo');

/**
 * @returns {getSyncStatus}
 */
function getSyncStatusFactory() {
  /**
   * @typedef getSyncStatus
   * @param {SyncState} syncState
   * @param {ChainInfo} chainInfo
   * @returns {Promise<string>}
   */
  async function getSyncStatus(syncState, chainInfo) {
    if (!syncState.getLastSyncAt()) {
      return SyncInfo.STATUSES.INITIAL_SYNC;
    }

    if (!chainInfo.getIsBlockchainSynced()) {
      return SyncInfo.STATUSES.SYNCING;
    }

    if (syncState.getLastBlockHash() !== chainInfo.getLastBlockHash()) {
      return SyncInfo.STATUSES.SYNCING;
    }

    return SyncInfo.STATUSES.SYNCED;
  }

  return getSyncStatus;
}

module.exports = getSyncStatusFactory;
