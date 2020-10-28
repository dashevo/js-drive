const SimplifiedMNListDiff = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListDiff');

const wait = require('../util/wait');
const LatestCoreChainLock = require('./LatestCoreChainLock');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {string} coreNetwork
 *
 * @returns {waitForCoreSync}
 */
function waitForDMLSyncFactory(
  coreRpcClient,
  latestCoreChainLock,
  simplifiedMasternodeList,
  coreNetwork,
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

    // create SMLStore
    let latestRequestedHeight = 1;
    if (latestCoreChainLock.chainLock) {
      const diff = await coreRpcClient.protx('diff', latestRequestedHeight, latestCoreChainLock.chainLock.height);
      latestRequestedHeight = latestCoreChainLock.chainLock.height;

      // add to SML
      const simplifiedMNListDiff = new SimplifiedMNListDiff(diff, coreNetwork);
      simplifiedMasternodeList.applyDiff(simplifiedMNListDiff);
    }

    latestCoreChainLock.on(LatestCoreChainLock.TOPICS.update, async (chainLock) => {
      const diff = await coreRpcClient.protx('diff', latestRequestedHeight, chainLock.height);
      latestRequestedHeight = chainLock.height;

      // add to SML
      const simplifiedMNListDiff = new SimplifiedMNListDiff(diff, coreNetwork);
      simplifiedMasternodeList.applyDiff(simplifiedMNListDiff);
    });
  }
  return waitForDMLSync;
}
module.exports = waitForDMLSyncFactory;
