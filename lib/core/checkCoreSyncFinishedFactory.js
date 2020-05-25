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
   * @returns {Promise<void>}
   */
  async function checkCoreSyncFinished(progressCallback) {
    let isBlockchainSynced = false;

    while (!isBlockchainSynced) {
      const {
        result: {
          blocks: currentBlockHeight,
          headers: currentHeadersNumber,
        },
      } = await coreRpcClient.getBlockchainInfo();

      progressCallback(currentBlockHeight, currentHeadersNumber);

      ({
        result: {
          IsBlockchainSynced: isBlockchainSynced,
        },
      } = await coreRpcClient.mnsync('status'));

      await wait(10000);
    }
  }

  return checkCoreSyncFinished;
}

module.exports = checkCoreSyncFinishedFactory;
