const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');

/**
 * Begin block ABCI handler
 *
 * @param {DataContractLevelDBRepository} dataContractRepository
 * @param {number|undefined} dpnsContractHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
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
      const contract = await dataContractRepository.fetch(dpnsContractId);

      if (contract === null) {
        throw new NoDPNSContractFoundError();
      }
    }

    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
