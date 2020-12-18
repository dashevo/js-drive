const {
  tendermint: {
    abci: {
      ResponseBeginBlock,
    },
  },
} = require('@dashevo/abci/types');

const NotSupportedProtocolVersionError = require('./errors/NotSupportedProtocolVersionError');

/**
 * Begin block ABCI handler
 *
 * @param {ChainInfo} chainInfo
 * @param {BlockExecutionStoreTransactions} blockExecutionStoreTransactions
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {Number} protocolVersion - Protocol version
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {waitForChainLockedHeight} waitForChainLockedHeight
 * @param {BaseLogger} logger
 *
 * @return {beginBlockHandler}
 */
function beginBlockHandlerFactory(
  chainInfo,
  blockExecutionStoreTransactions,
  blockExecutionContext,
  protocolVersion,
  updateSimplifiedMasternodeList,
  waitForChainLockedHeight,
  logger,
) {
  /**
   * @typedef beginBlockHandler
   *
   * @param {abci.RequestBeginBlock} request
   * @return {Promise<abci.ResponseBeginBlock>}
   */
  async function beginBlockHandler({ header }) {
    logger.info(`Block begin #${header.height}`);

    const {
      coreChainLockedHeight,
      height,
      version,
    } = header;

    await waitForChainLockedHeight(coreChainLockedHeight);

    await updateSimplifiedMasternodeList(coreChainLockedHeight);

    blockExecutionContext.reset();

    blockExecutionContext.setHeader(header);

    chainInfo.setLastBlockHeight(height);
    chainInfo.setLastCoreChainLockedHeight(coreChainLockedHeight);

    if (version.app.gt(protocolVersion)) {
      throw new NotSupportedProtocolVersionError(
        version.app,
        protocolVersion,
      );
    }

    await blockExecutionStoreTransactions.start();

    return new ResponseBeginBlock();
  }

  return beginBlockHandler;
}

module.exports = beginBlockHandlerFactory;
