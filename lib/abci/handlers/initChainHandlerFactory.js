const {
  abci: {
    ResponseInitChain,
  },
} = require('abci/types');
const waitForEvent = require('../../util/waitForEvent');
/**
 * Init Chain ABCI handler
 *
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {BlockchainState} blockchainState
 * @param {ZMQClient} coreZMQClient
 * @param {RpcClient} coreRpcClient
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  latestCoreChainLock,
  blockchainState,
  coreZMQClient,
  coreRpcClient,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestInitChain} request
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
