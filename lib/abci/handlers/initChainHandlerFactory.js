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

/**
 * Init Chain ABCI handler
 *
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {number} initialCoreChainLockedHeight
 * @param {ValidatorQuorums} validatorQuorums
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  updateSimplifiedMasternodeList,
  initialCoreChainLockedHeight,
  validatorQuorums,
  logger,
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

    await validatorQuorums.init(initialCoreChainLockedHeight);

    const initialValidatorSet = validatorQuorums.getValidatorSet();

    contextLogger.trace(`Initial validator set selected: quorumHash ${initialValidatorSet.quorumHash}`);

    const validatorSetUpdate = new ValidatorSetUpdate({
      validatorUpdates: await validatorQuorums.toABCIValidatorUpdates(),
      thresholdPublicKey: new PublicKey({
        bls12381: Buffer.from(initialValidatorSet.quorumPublicKey, 'hex'),
      }),
      quorumHash: Buffer.from(initialValidatorSet.quorumHash, 'hex'),
    });

    return new ResponseInitChain({
      validatorSetUpdate,
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
