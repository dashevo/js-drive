const {
  tendermint: {
    abci: {
      ResponseInitChain,
      ValidatorSetUpdate,
    },
    crypto: {
      PublicKey,
    },
  },
} = require('@dashevo/abci/types');

const NotFoundAbciError = require('../../abci/errors/NotFoundAbciError');

const ValidatorSet = require('../../validatorSet/ValidatorSet');

const fillValidatorUpdates = require('../../util/fillValidatorUpdates');

/**
 * Init Chain ABCI handler
 *
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {number} initialCoreChainLockedHeight
 * @param {getValidatorSetInfo} getValidatorSetInfo
 * @param {BaseLogger} logger
 * @param {container} container
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  simplifiedMasternodeList,
  updateSimplifiedMasternodeList,
  initialCoreChainLockedHeight,
  getValidatorSetInfo,
  logger,
  container,
) {
  /**
   * @typedef initChainHandler
   *
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler() {
    logger.info('Init chain');

    await updateSimplifiedMasternodeList(initialCoreChainLockedHeight);

    const smlStore = simplifiedMasternodeList.getStore();
    if (smlStore === undefined) {
      logger.debug('initChainHandler: SMLStore is not defined');
      throw new Error('initChainHandler: SMLStore is not defined');
    }
    const sml = smlStore.getCurrentSML();
    const validatorLlmqType = sml.getValidatorLLMQType();

    const validatorQuorumHash = await new ValidatorSet(smlStore).getHashForCoreHeight(
      Buffer.from(header.lastCommitHash), initialCoreChainLockedHeight,
    );

    container.register({
      validatorQuorumHash: asValue(validatorQuorumHash),
    });

    const initialValidatorSet = sml.getQuorum(validatorLlmqType, validatorQuorumHash);

    const validators = await getValidatorSetInfo(validatorLlmqType, initialValidatorSet.quorumHash);
    if (!validators.length) {
      // this should never happen
      throw new NotFoundAbciError('No validator info for initial validator set found');
    }

    const initialValidatorsUpdates = fillValidatorUpdates(validators);
    logger.trace(`Initial validator set selected: quorumHash ${initialValidatorSet.quorumHash}`);

    return new ResponseInitChain({
      validatorSetUpdate: new ValidatorSetUpdate({
        validatorUpdates: initialValidatorsUpdates,
        thresholdPublicKey: new PublicKey({
          bls12381: Uint8Array.from(Buffer.from(initialValidatorSet.quorumPublicKey, 'hex')),
        }),
      }),
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
