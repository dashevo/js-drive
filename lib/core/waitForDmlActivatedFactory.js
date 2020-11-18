const wait = require('../util/wait');

/**
 * Check that DML is activated (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {number} smlMaxListsLimit
 * @param {string} network
 * @param {BaseLogger} logger
 *
 * @returns {waitForDmlActivated}
 */
function waitForDmlActivatedFactory(
  coreRpcClient,
  logger,
) {
  /**
   * Wait for DML to be activated on the block 1000
   *
   * @typedef waitForDmlActivated
   *
   * @returns {Promise<void>}
   */
  async function waitForDmlActivated() {
    let { result: currentBlock } = await coreRpcClient.getBlockCount();

    // Wait for 1000 blocks height to make sure that DML is enabled
    if (currentBlock < 1000) {
      logger.debug('Wait for DML to be activated');

      do {
        await wait(10000);

        ({ result: currentBlock } = await coreRpcClient.getBlockCount());
      } while (currentBlock < 1000);
    }
  }

  return waitForDmlActivated;
}

module.exports = waitForDmlActivatedFactory;
