const {
  tendermint: {
    abci: {
      ResponseInitChain,
      ValidatorSetUpdate,
      QuorumHashUpdate,
    },
    crypto: {
      PublicKey,
    },
  },
} = require('@dashevo/abci/types');

const { asValue } = require('awilix');

const NotFoundAbciError = require('../errors/NotFoundAbciError');

const ValidatorSet = require('../../validatorSet/ValidatorSet');

/**
 * Init Chain ABCI handler
 *
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {number} initialCoreChainLockedHeight
 * @param {getValidatorSetInfo} getValidatorSetInfo
 * @param {BaseLogger} logger
 * @param {AwilixContainer} container
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
   * @param {abci.RequestInitChain} request
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler(request) {
    const contextLogger = logger.child({
      height: request.initialHeight.toString(),
      abciMethod: 'initChain',
    });

    contextLogger.debug('InitChain ABCI method requested');
    contextLogger.trace({ abciRequest: request });

    await updateSimplifiedMasternodeList(initialCoreChainLockedHeight, {
      logger: contextLogger,
    });

    contextLogger.info(`Init ${request.chainId} chain on block #${request.initialHeight.toString()}`);

    const smlStore = simplifiedMasternodeList.getStore();
    if (smlStore === undefined) {
      contextLogger.debug('initChainHandler: SMLStore is not defined');
      throw new Error('initChainHandler: SMLStore is not defined');
    }

    const initialSml = smlStore.getSMLbyHeight(initialCoreChainLockedHeight);
    const validatorLlmqType = initialSml.getValidatorLLMQType();
    const genesisCoreBlockHash = initialSml.toSimplifiedMNListDiff().blockHash;

    const initialValidatorQuorumHash = await new ValidatorSet(initialSml).getHash(
      Buffer.from(genesisCoreBlockHash),
    );

    container.register({
      validatorQuorumHash: asValue(initialValidatorQuorumHash),
    });

    const initialValidatorSet = initialSml.getQuorum(validatorLlmqType, initialValidatorQuorumHash);

    const validators = await getValidatorSetInfo(validatorLlmqType, initialValidatorSet.quorumHash);
    if (!validators || !validators.length) {
      // this should never happen
      throw new NotFoundAbciError('No validator info for initial validator set found');
    }

    const initialValidatorsUpdates = ValidatorSet.fillValidatorUpdates(validators);
    contextLogger.trace(`Initial validator set selected: quorumHash ${initialValidatorSet.quorumHash}`);

    return new ResponseInitChain({
      validatorSetUpdate: new ValidatorSetUpdate({
        validatorUpdates: initialValidatorsUpdates,
        thresholdPublicKey: new PublicKey({
          bls12381: Uint8Array.from(Buffer.from(initialValidatorSet.quorumPublicKey, 'hex')),
        }),
        quorumHash: new QuorumHashUpdate({ quorumHash: initialValidatorSet.quorumHash }),
      }),
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
