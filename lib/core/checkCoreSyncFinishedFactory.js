const wait = require('../util/wait');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {Logger} logger
 *
 * @returns {checkCoreSyncFinished}
 */
function checkCoreSyncFinishedFactory(coreRpcClient, logger) {
  /**
   * Check that core is synced
   *
   * @typedef checkCoreSyncFinished
   *
   * @returns {Promise<Boolean>}
   */
  async function checkCoreSyncFinished(prevBlockHeight = 0) {
    logger.info('Checking for Core to finish sync process...');

    const {
      result: {
        blocks: lastBlockHeight,
      },
    } = await coreRpcClient.getBlockchainInfo();

    logger.info(`Synced ${lastBlockHeight - prevBlockHeight} blocks since last check`);

    const {
      result: {
        IsBlockchainSynced: isBlockchainSynced,
      },
    } = await coreRpcClient.mnsync('status');

    logger.info(`Is block chain synced: ${isBlockchainSynced}`);

    if (!isBlockchainSynced) {
      await wait(10000);

      const result = await checkCoreSyncFinished(lastBlockHeight);

      return result;
    }

    return isBlockchainSynced;
  }

  return checkCoreSyncFinished;
}

module.exports = checkCoreSyncFinishedFactory;
