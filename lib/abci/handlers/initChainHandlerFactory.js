const {
  abci: {
    ResponseInitChain,
  },
} = require('abci/types');

/**
 * Init Chain ABCI handler
 *
 * @param {BlockchainState} blockchainState
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  blockchainState,
  latestCoreChainLock,
  logger,
) {
  /**
   * @typedef initChainHandler
   *
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler() {
    logger.info('Init chain');
    return new ResponseInitChain({
      latestCoreChainLock,
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
