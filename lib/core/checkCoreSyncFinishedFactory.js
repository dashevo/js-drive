const wait = require('../util/wait');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 *
 * @returns {checkCoreSyncFinished}
 */
function checkCoreSyncFinishedFactory(coreRpcClient) {
  /**
   * Check that core is synced
   *
   * @typedef checkCoreSyncFinished
   *
   * @param {function(number, number)} progressCallback
   *
   * @returns {Promise<Boolean>}
   */
  async function checkCoreSyncFinished(progressCallback) {
    const {
      result: {
        blocks: currentBlockHeight,
        headers: currentHeadersNumber,
      },
    } = await coreRpcClient.getBlockchainInfo();

    progressCallback(currentBlockHeight, currentHeadersNumber);

    const {
      result: {
        IsBlockchainSynced: isBlockchainSynced,
      },
    } = await coreRpcClient.mnsync('status');

    if (!isBlockchainSynced) {
      await wait(10000);

      const result = await checkCoreSyncFinished(progressCallback);

      return result;
    }

    return isBlockchainSynced;
  }

  return checkCoreSyncFinished;
}

module.exports = checkCoreSyncFinishedFactory;
