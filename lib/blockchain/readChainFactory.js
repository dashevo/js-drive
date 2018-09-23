/**
 * @param {STHeadersReader} stHeadersReader
 * @param {SyncState} syncState
 * @param {string} sinceBlockHash
 * @returns {Promise<void>}
 */
async function resetFromMostCurrentBlock(stHeadersReader, syncState, sinceBlockHash) {
  // Start sync from the last synced block + 1
  stHeadersReader.stHeaderIterator.blockIterator.setBlockHeightFromSyncState(syncState);
  // Reset height to the current block's height
  await stHeadersReader.stHeaderIterator.blockIterator.resetFromCurrentBlockHeight(sinceBlockHash);
  stHeadersReader.stHeaderIterator.reset(false);
}

/**
 * @param {STHeadersReader} stHeadersReader
 * @param {SyncState} syncState
 * @param {cleanDashDrive} cleanDashDrive
 * @returns {readChain}
 */
function readChainFactory(stHeadersReader, syncState, cleanDashDrive) {
  let isInSync = false;

  /**
   * @typedef {Promise} readChain
   * @param {string} [sinceBlockHash]
   * @returns {Promise<void>}
   */
  async function readChain(sinceBlockHash) {
    try {
      if (isInSync) {
        return;
      }
      isInSync = true;

      await resetFromMostCurrentBlock(stHeadersReader, syncState, sinceBlockHash);

      await stHeadersReader.read();
      isInSync = false;
    } catch (error) {
      if (error.message === 'Block height out of range' && !syncState.isEmpty()) {
        await cleanDashDrive();

        stHeadersReader.resetToBlockHeight(1);
        syncState.clean();

        isInSync = false;

        await readChain();

        return;
      }
      isInSync = false;
      throw error;
    }
  }

  return readChain;
}

module.exports = readChainFactory;
