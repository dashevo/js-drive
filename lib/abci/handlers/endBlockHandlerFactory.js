const Validators = require('@dashevo/js-drive-light-client/lib/validators/Validators');

const {
  tendermint: {
    abci: {
      ResponseEndBlock,
      ValidatorUpdate,
    },
  },
} = require('@dashevo/abci/types');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');

const ROTATION_BLOCK_INTERVAL = 15;

/**
 * End Block ABCI Handler
 *
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {number|undefined} dpnsContractBlockHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {RpcClient} coreRpcClient
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockExecutionContext,
  dpnsContractBlockHeight,
  dpnsContractId,
  coreRpcClient,
  simplifiedMasternodeList,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestEndBlock} request
   * @return {Promise<abci.ResponseEndBlock>}
   */
  async function endBlockHandler({ height }) {
    logger.info(`Block end #${height}`);

    if (dpnsContractId && height === dpnsContractBlockHeight) {
      if (!blockExecutionContext.hasDataContract(dpnsContractId)) {
        throw new NoDPNSContractFoundError(dpnsContractId, dpnsContractBlockHeight);
      }
    }
    // validator set needs to be rotated every n blocks
    if (height % ROTATION_BLOCK_INTERVAL === 0) {
      const rotationEntropy = blockExecutionContext.getHeader().lastCommitHash;
      const coreHeight = blockExecutionContext.getHeader().coreChainLockedHeight;
      const smlStore = simplifiedMasternodeList.getStore();
      if (smlStore === undefined) {
        logger.debug('SMLStore is not defined');
        throw new Error('SMLStore is not defined');
      }
      const newValidatorSet = new Validators(smlStore).getValidatorSetForCoreHeight(
        Buffer.from(rotationEntropy), coreHeight, false,
      );
      // call quorum info rpc cmd to get all validator set members' info
      let quorumInfo = {};
      // eslint-disable-next-line no-useless-catch
      try {
        quorumInfo = await coreRpcClient.quorum(
          'info', `${smlStore.currentSML.getValidatorLLMQType()}`, `${newValidatorSet.quorumHash}`,
        );
      } catch (e) {
        logger.error(`${e}`);
        throw e;
      }
      const { members } = quorumInfo.result.members;
      if (!members.length) {
        // throw new QuorumThresholdError
        throw new NoDPNSContractFoundError(dpnsContractId, dpnsContractBlockHeight);
      }
      const validatorUpdates = [];
      members.forEach((member) => {
        const validatorUpdate = new ValidatorUpdate();
        validatorUpdate.proTxHash = member.proTxHash;
        if (member.pubKeyShare) {
          // hey, this is me!
          validatorUpdate.pubKeyShare = member.pubKeyShare;
        }
        validatorUpdate.power = 100;
        validatorUpdates.push(validatorUpdate);
      });
      const validatorUpdateResponse = new ResponseEndBlock();
      validatorUpdateResponse.validatorUpdates = validatorUpdates;
      logger.info(`Rotated validator set: new quorumHash ${newValidatorSet.quorumHash}`);
      return validatorUpdateResponse;
    }
    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
