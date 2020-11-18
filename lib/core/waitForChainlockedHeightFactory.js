const MissingChainLockError = require('./errors/MissingChainLockError');
const wait = require('../util/wait');

/**
 *
 * @param {LatestCoreChainLock} latestCoreChainLock

 * @return {waitForChainlockedHeight}
 */
function waitForChainlockedHeightFactory(
  latestCoreChainLock,
) {
  /**
   * @typedef waitForChainlockedHeight
   * @param {number} coreHeight
   *
   * @return {Promise<void>}
   */
  async function waitForChainlockedHeight(coreHeight) {
    // ChainLock is required to get finalized SML that won't be reorged
    let chainLock = latestCoreChainLock.getChainLock();

    if (!chainLock) {
      throw new MissingChainLockError();
    }

    // Wait for core to be synced up to coreHeight
    if (coreHeight > chainLock.height) {
      do {
        await wait(10000);

        chainLock = latestCoreChainLock.getChainLock();
      } while (coreHeight > chainLock.height);
    }
  }

  return waitForChainlockedHeight;
}

module.exports = waitForChainlockedHeightFactory;
