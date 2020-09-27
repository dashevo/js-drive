const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

/**
 * End block ABCI handler
 *
 * @param {BlockchainState} blockchainState
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockchainState,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestEndBlock} request
   * @return {Promise<abci.ResponseEndBlock>}
   */
  async function endBlockHandler({ latestCoreChainLock }) {
    logger.info('Block end');


    return new ResponseEndBlock({
      latestCoreChainLock,
    });
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
