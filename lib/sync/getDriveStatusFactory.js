const SyncStatus = require('./SyncStatus');

/**
 * @param {RpcClient} rpcClient
 * @returns {getDriveStatus}
 */
function getDriveStatusFactory(rpcClient) {
  /**
   * @typedef getDriveStatus
   * @param {SyncState} syncState
   * @returns {Promise<string>}
   */
  async function getDriveStatus(syncState) {
    const lastSyncedBlock = syncState.getLastBlock();
    const lastSyncAt = syncState.getLastSyncAt();

    if (!lastSyncAt) {
      return SyncStatus.STATUSES.INITIAL_SYNC;
    }

    const { result: blockCount } = await rpcClient.getBlockCount();
    const { result: { IsBlockchainSynced: isSynced } } = await rpcClient.mnsync('status');
    if (blockCount === 0 || !isSynced) {
      return SyncStatus.STATUSES.SYNCING;
    }

    const { result: lastBlockHash } = await rpcClient.getBlockHash(blockCount);
    if (lastSyncedBlock && lastSyncedBlock.hash !== lastBlockHash) {
      return SyncStatus.STATUSES.SYNCING;
    }

    return SyncStatus.STATUSES.SYNCED;
  }

  return getDriveStatus;
}

module.exports = getDriveStatusFactory;
