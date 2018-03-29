const CHAIN_IS_SYNCED_INTERVAL = 5000;

/**
 * Check is sync process complete
 *
 * @param {RpcClient} rpcClient
 * @param {SyncStateRepositoryChangeListener} stateRepositoryChangeListener
 * @return {Promise<SyncState>}
 */
module.exports = async function isSynced(rpcClient, stateRepositoryChangeListener) {
  await _waitUntilBlockchainIsSynced();

  const stateRepository = stateRepositoryChangeListener.getRepository();

  // Compare last block in chain and last synced block
  const syncState = await stateRepository.fetch();
  const lastSyncedBlock = syncState.getLastBlock();

  const { result: blockCount } = await rpcClient.getBlockCount();

  let lastBlockHash;
  if (blockCount > 0) {
    ({ result: lastBlockHash } = await rpcClient.getBlockHash(blockCount));
  }

  if (lastSyncedBlock && lastSyncedBlock.hash === lastBlockHash) {
    return syncState;
  }

  // Wait until sync process is complete
  return new Promise((resolve, reject) => {
    const changeHandler = (updatedSyncState) => {
      if (updatedSyncState.getLastSyncAt().getTime() === syncState.getLastSyncAt().getTime()) {
        return;
      }

      stateRepositoryChangeListener.removeListener('change', changeHandler);
      stateRepositoryChangeListener.stop();

      resolve(updatedSyncState);
    };

    stateRepositoryChangeListener.on('change', changeHandler);
    stateRepositoryChangeListener.on('error', reject);

    stateRepositoryChangeListener.listen();
  });

  async function _waitUntilBlockchainIsSynced() {
    return new Promise((resolve) => {
      async function checkStatus() {
        const status = await rpcClient.mnsync('status');
        if (status.IsBlockchainSynced) return resolve();
        setTimeout(checkStatus, CHAIN_IS_SYNCED_INTERVAL);
      }
      checkStatus();
    });
  }
};
