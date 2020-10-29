const SimplifiedMNListDiff = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListDiff');

const wait = require('../util/wait');
const LatestCoreChainLock = require('./LatestCoreChainLock');

const MissingChainlockError = require('./errors/MissingChainlockError');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {number} smlMaxListsLimit
 * @param {string} network
 * @param {BaseLogger} logger
 *
 * @returns {waitForCoreSync}
 */
function waitForDMLSyncFactory(
  coreRpcClient,
  latestCoreChainLock,
  simplifiedMasternodeList,
  smlMaxListsLimit,
  network,
  logger,
) {
  /**
   * Check that core is synced
   *
   * @typedef waitForDMLSyncFactory
   *
   * @returns {Promise<void>}
   */
  async function waitForDMLSync() {
    let { result: currentBlock } = await coreRpcClient.getBlockCount();

    if (currentBlock < 1000) {
      // wait for 1000 blocks height
      do {
        await wait(10000);

        ({ result: currentBlock } = await coreRpcClient.getBlockCount());
      } while (currentBlock < 1000);
    }

    let latestRequestedHeight = 1;
    const chainLock = latestCoreChainLock.getChainLock();

    if (!chainLock) {
      throw new MissingChainlockError();
    }

    const heightOffset = chainLock.height - smlMaxListsLimit;

    let { result: rawDiff } = await coreRpcClient.protx('diff', latestRequestedHeight, heightOffset);

    const simplifiedMNListDiffArray = [new SimplifiedMNListDiff(rawDiff, network)];

    for (let height = heightOffset; height < chainLock.height; height += 1) {
      ({ result: rawDiff } = await coreRpcClient.protx('diff', height, height + 1));

      simplifiedMNListDiffArray.push(new SimplifiedMNListDiff(rawDiff, network));
    }

    // add to SML
    simplifiedMasternodeList.applyDiff(simplifiedMNListDiffArray);

    latestRequestedHeight = chainLock.height;

    logger.debug('Initial SML was set');

    let isProcessing = false;

    // topics events
    latestCoreChainLock.on(LatestCoreChainLock.TOPICS.update, async (updatedChainLock) => {
      if (isProcessing) {
        return;
      }

      isProcessing = true;

      const updatedSimplifiedMNListDiffArray = [];

      for (let height = latestRequestedHeight; height < updatedChainLock.height; height += 1) {
        const { result: updatedRawDiff } = await coreRpcClient.protx('diff', height, height + 1);

        updatedSimplifiedMNListDiffArray.push(new SimplifiedMNListDiff(updatedRawDiff, network));
      }

      // add to SML
      simplifiedMasternodeList.applyDiff(updatedSimplifiedMNListDiffArray);

      latestRequestedHeight = updatedChainLock.height;

      logger.debug('Updated SML');

      isProcessing = false;
    });
  }

  return waitForDMLSync;
}
module.exports = waitForDMLSyncFactory;
