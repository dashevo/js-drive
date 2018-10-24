/**
 *
 * @param {readChain} readChain
 * @return {readChainWithThrottling}
 */
module.exports = function readChainWithThrottlingFactory(readChain) {
  let isInSync = false;
  let wasCalledDuringSync = false;

  /**
   * @typedef readChainWithThrottling
   * @return {Promise<void>}
   */
  async function readChainWithThrottling() {
    try {
      if (isInSync) {
        wasCalledDuringSync = true;

        return;
      }

      isInSync = true;

      await readChain();

      isInSync = false;

      if (wasCalledDuringSync) {
        wasCalledDuringSync = false;
        await readChainWithThrottling();
      }
    } catch (error) {
      isInSync = false;

      throw error;
    }
  }

  return readChainWithThrottling;
};
