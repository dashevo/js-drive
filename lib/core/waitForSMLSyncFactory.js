const SimplifiedMNListDiff = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListDiff');

/**
 * Check that core is synced (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {number} smlMaxListsLimit
 * @param {string} network
 * @param {BaseLogger} logger
 *
 * @returns {waitForSMLSync}
 */
function waitForSMLSyncFactory(
  coreRpcClient,
  simplifiedMasternodeList,
  smlMaxListsLimit,
  network,
  logger,
) {
  // 1 means first block
  let latestRequestedHeight = 1;

  /**
   * @param {number} fromHeight
   * @param {number} toHeight
   * @return {Promise<SimplifiedMNListDiff[]>}
   */
  async function fetchDiffsPerBlock(fromHeight, toHeight) {
    const diffs = [];

    for (let height = fromHeight; height < toHeight; height += 1) {
      const { result: rawDiff } = await coreRpcClient.protx('diff', height, height + 1);

      const diff = new SimplifiedMNListDiff(rawDiff, network);

      diffs.push(diff);
    }

    return diffs;
  }

  /**
   * Check that core is synced
   *
   * @typedef waitForSMLSync
   * @param {number} coreHeight
   *
   * @returns {Promise<void>}
   */
  async function waitForSMLSync(coreHeight) {
    if (latestRequestedHeight === 1) {
      // Initialize SML with 16 diffs to have enough quorum information
      // to be able to verify signatures

      const startHeight = coreHeight - smlMaxListsLimit;

      const { result: rawDiff } = await coreRpcClient.protx('diff', latestRequestedHeight, startHeight);

      const initialSmlDiffs = [
        new SimplifiedMNListDiff(rawDiff, network),
        ...await fetchDiffsPerBlock(startHeight, coreHeight),
      ];

      simplifiedMasternodeList.applyDiffs(initialSmlDiffs);

      latestRequestedHeight = coreHeight;

      logger.debug(`SML is initialized for heights ${startHeight} to ${coreHeight}`);
    } else if (latestRequestedHeight < coreHeight) {
      // Update SML

      const smlDiffs = await fetchDiffsPerBlock(latestRequestedHeight, coreHeight);

      simplifiedMasternodeList.applyDiffs(smlDiffs);

      logger.debug(`SML is updated for heights ${latestRequestedHeight} to ${coreHeight}`);

      latestRequestedHeight = coreHeight;
    }
  }

  return waitForSMLSync;
}

module.exports = waitForSMLSyncFactory;
