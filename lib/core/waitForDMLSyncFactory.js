const SimplifiedMNListStore = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListStore');
const SimplifiedMNListDiff = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListDiff');

const wait = require('../util/wait');
const LatestCoreChainLock = require('./LatestCoreChainLock');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {string} network
 *
 * @returns {waitForCoreSync}
 */
function waitForDMLSyncFactory(
  coreRpcClient,
  latestCoreChainLock,
  network,
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
    let simplifiedMNListStore;

    let latestRequestedHeight = 1;
    const chainLock = latestCoreChainLock.getChainLock();

    if (chainLock) {
      const { result: rawDiff } = await coreRpcClient.protx('diff', latestRequestedHeight, chainLock.height);
      latestRequestedHeight = chainLock.height;

      // add to SML
      const diff = new SimplifiedMNListDiff(rawDiff, network);
      simplifiedMNListStore = new SimplifiedMNListStore(diff);
    }

    latestCoreChainLock.on(LatestCoreChainLock.TOPICS.update, async (updatedChainLock) => {
      const { result: rawDiff } = await coreRpcClient.protx('diff', latestRequestedHeight, updatedChainLock.height);
      latestRequestedHeight = updatedChainLock.height;

      // add to SML
      const diff = new SimplifiedMNListDiff(rawDiff, network);
      if (simplifiedMNListStore) {
        simplifiedMNListStore.addDiff(diff);
      } else {
        simplifiedMNListStore = new SimplifiedMNListStore(diff);
      }
    });
  }
  return waitForDMLSync;
}
module.exports = waitForDMLSyncFactory;
