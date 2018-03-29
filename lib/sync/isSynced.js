require('dotenv').config();

async function waitUntilBlockchainIsSynced(rpcClient) {
  const INTERVAL = process.env.CHAIN_IS_SYNCED_INTERVAL * 1000;
  return new Promise((resolve) => {
    async function checkStatus() {
      const status = await rpcClient.mnsync('status');
      if (status.result.IsBlockchainSynced) return resolve();
      return setTimeout(checkStatus, INTERVAL);
    }
    checkStatus();
  });
}

async function isDriveSynced(rpcClient, syncState) {
  const lastSyncedBlock = syncState.getLastBlock();

  const { result: blockCount } = await rpcClient.getBlockCount();

  let lastBlockHash;
  if (blockCount > 0) {
    ({ result: lastBlockHash } = await rpcClient.getBlockHash(blockCount));
  }

  if (lastSyncedBlock && lastSyncedBlock.hash === lastBlockHash) {
    return true;
  }

  return false;
}

async function waitUntilDriveIsSynced(stateRepositoryChangeListener, syncState) {
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
}

/**
 * Check is sync process complete
 *
 * @param {RpcClient} rpcClient
 * @param {SyncStateRepositoryChangeListener} stateRepositoryChangeListener
 * @return {Promise<SyncState>}
 */
module.exports = async function isSynced(rpcClient, stateRepositoryChangeListener) {
  await waitUntilBlockchainIsSynced(rpcClient);

  // Compare last block in chain and last synced block
  const stateRepository = stateRepositoryChangeListener.getRepository();
  const syncState = await stateRepository.fetch();
  const driveSynced = await isDriveSynced(rpcClient, syncState);
  if (driveSynced) return syncState;

  return waitUntilDriveIsSynced(stateRepositoryChangeListener, syncState);
};
