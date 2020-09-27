const {
  abci: {
    ResponseInitChain,
  },
} = require('abci/types');

/**
 * Init Chain ABCI handler
 *
 * @param {BlockchainState} blockchainState
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  blockchainState,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestInitChain} request
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler({ latestCoreChainLock }) {
    logger.info('Init chain');
    return new ResponseInitChain({
      latestCoreChainLock,
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
