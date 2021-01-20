const {
  tendermint: {
    abci: {
      ResponseInitChain,
    },
  },
} = require('@dashevo/abci/types');

/**
 * Init Chain ABCI handler
 *
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {number} initialCoreChainLockedHeight
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  updateSimplifiedMasternodeList,
  initialCoreChainLockedHeight,
  logger,
) {
  /**
   * @typedef initChainHandler
   *
   * @param {abci.RequestInitChain} request
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler(request) {
    logger.debug('InitChain ABCI method requested');
    logger.trace({ request });

    await updateSimplifiedMasternodeList(initialCoreChainLockedHeight);

    logger.info(`Init ${request.chainId} chain on block #${request.initialHeight.toString()}`);

    return new ResponseInitChain();
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
