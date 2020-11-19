const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');

const NotSupportedProtocolVersionError = require('./errors/NotSupportedProtocolVersionError');

/**
 * Begin block ABCI handler
 *
 * @param {ChainInfo} chainInfo
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {Number} protocolVersion - Protocol version
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {waitForChainlockedHeight} waitForChainlockedHeight
 * @param {BaseLogger} logger
 *
 * @return {beginBlockHandler}
 */
function beginBlockHandlerFactory(
  chainInfo,
  blockExecutionDBTransactions,
  blockExecutionContext,
  protocolVersion,
  updateSimplifiedMasternodeList,
  waitForChainlockedHeight,
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

    const { coreHeight } = header;

    await waitForChainlockedHeight(coreHeight);

    await updateSimplifiedMasternodeList(coreHeight);

    blockExecutionContext.reset();

    blockExecutionContext.setHeader(header);

    chainInfo.setLastBlockHeight(header.height);

    if (header.version.App.gt(protocolVersion)) {
      throw new NotSupportedProtocolVersionError(
        header.version.App,
        protocolVersion,
      );
    }

    await blockExecutionDBTransactions.start();

    return new ResponseBeginBlock();
  }

  return beginBlockHandler;
}

module.exports = beginBlockHandlerFactory;
