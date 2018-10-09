/**
 * @param {STHeadersReader} stHeadersReader
 * @param {RpcClient} rpcClient
 * @param {SyncState} syncState
 * @param {string} sinceBlockHash
 * @returns {Promise<void>}
 */
async function setMostCurrentBlockHeight(stHeadersReader, rpcClient, syncState, sinceBlockHash) {
  // Start sync from the last synced block + 1
  let height = stHeadersReader.stHeaderIterator.blockIterator.getBlockHeight();
  if (syncState.getLastInitialSyncAt()) {
    height += 1;
  }
  // Reset height to the current block's height
  if (sinceBlockHash) {
    const { result: { height: sinceBlockHeight } } = await rpcClient.getBlock(sinceBlockHash);
    if (sinceBlockHeight < height) {
      height = sinceBlockHeight;
    }
  }
  stHeadersReader.stHeaderIterator.blockIterator.setBlockHeight(height);
  stHeadersReader.stHeaderIterator.reset(false);
}

/**
 * @param {STHeadersReader} stHeadersReader
 * @param {RpcClient} rpcClient
 * @param {SyncState} syncState
 * @param {cleanDashDrive} cleanDashDrive
 * @returns {readChain}
 */
function readChainFactory(stHeadersReader, rpcClient, syncState, cleanDashDrive) {
  /**
   * @typedef {Promise} readChain
   * @param {string} [sinceBlockHash]
   * @returns {Promise<void>}
   */
  async function readChain(sinceBlockHash) {
    try {
      await setMostCurrentBlockHeight(stHeadersReader, rpcClient, syncState, sinceBlockHash);

      await stHeadersReader.read();
    } catch (error) {
      if (error.message === 'Block height out of range' && !syncState.isEmpty()) {
        await cleanDashDrive();

        stHeadersReader.resetToBlockHeight(1);
        syncState.clean();

        await readChain();

        return;
      }
      throw error;
    }
  }

  return readChain;
}

module.exports = readChainFactory;
