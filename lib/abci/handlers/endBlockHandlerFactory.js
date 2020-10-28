const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');

/**
 * Begin block ABCI handler
 *
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @param {DataContractLevelDBRepository} dataContractRepository
 * @param {number|undefined} dpnsContractHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockExecutionDBTransactions,
  dataContractRepository,
  dpnsContractHeight,
  dpnsContractId,
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

    const areDPNSEnvsDefined = dpnsContractHeight !== undefined
      && dpnsContractId !== undefined;

    if (areDPNSEnvsDefined && header.height === dpnsContractHeight) {
      const transaction = blockExecutionDBTransactions.getTransaction('dataContract');

      const contract = await dataContractRepository.fetch(dpnsContractId, transaction);

      if (contract === null) {
        throw new NoDPNSContractFoundError(dpnsContractId, dpnsContractHeight);
      }
    }

    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
