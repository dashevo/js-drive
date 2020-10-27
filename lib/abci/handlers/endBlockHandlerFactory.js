const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

const NotSupportedProtocolVersionError = require('./errors/NotSupportedProtocolVersionError');

/**
 * Begin block ABCI handler
 *
 * @param {BlockchainState} blockchainState
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @param {BlockExecutionState} blockExecutionState
 * @param {Number} protocolVersion - Protocol version
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockchainState,
  blockExecutionDBTransactions,
  blockExecutionState,
  protocolVersion,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestBeginBlock} request
   * @return {Promise<abci.ResponseBeginBlock>}
   */
  async function endBlockHandler({ header }) {
    logger.info(`Block end #${header.height}`);

    const DPNSEnvsAreDefined = DPNS_CONTRACT_HEIGHT && DPNS_CONTRACT_ID;

    if (DPNSEnvsAreDefined && header.height >= DPNS_CONTRACT_HEIGHT) {
      const contract = await getContract(DPNS_CONTRACT_ID);

      throw new NoDPNSContractFoundError();
    }

    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
