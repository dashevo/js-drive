const {
  tendermint: {
    abci: {
      ResponseInitChain,
    },
  }
} = require('@dashevo/abci/types');

/**
 * Init Chain ABCI handler
 *
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  logger,
) {
  /**
   * @typedef initChainHandler
   *
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler() {
    logger.info('Init chain');

    return new ResponseInitChain();
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
