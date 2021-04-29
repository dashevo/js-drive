const {
  tendermint: {
    abci: {
      ResponseQuery,
    },
  },
} = require('@dashevo/abci/types');

const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');

/**
 *
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {decodeChainLock} decodeChainLock
 * @param {getLatestFeatureFlag} getLatestFeatureFlag
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {FeatureFlagTypes} featureFlagTypes
 * @param {RpcClient} coreRpcClient
 * @param {BaseLogger} logger
 * @return {verifyChainLockQueryHandler}
 */
function verifyChainLockQueryHandlerFactory(
  simplifiedMasternodeList,
  decodeChainLock,
  getLatestFeatureFlag,
  blockExecutionContext,
  featureFlagTypes,
  coreRpcClient,
  logger,
) {
  /**
   * @typedef verifyChainLockQueryHandler
   * @param {Object} params
   * @param {Buffer} data
   * @return {Promise<ResponseQuery>}
   */
  async function verifyChainLockQueryHandler(params, data) {
    const smlStore = simplifiedMasternodeList.getStore();

    if (smlStore === undefined) {
      throw new Error('SML Store is not defined for verify chain lock handler');
    }

    const chainLock = decodeChainLock(data);

    const {
      height: blockHeight,
    } = blockExecutionContext.getHeader();

    const verifyLLMQSignaturesWithCoreFeatureFlag = await getLatestFeatureFlag(
      featureFlagTypes.VERIFY_LLMQ_SIGS_WITH_CORE,
      blockHeight,
    );

    if (!verifyLLMQSignaturesWithCoreFeatureFlag || !verifyLLMQSignaturesWithCoreFeatureFlag.get('enabled')) {
      // Here dashcore lib is used to verify chain lock,
      // but this approach doesn’t handle chain locks created by old quorums
      // that’a why a Core RPC method is used otherwise
      if (!chainLock.verify(smlStore)) {
        logger.debug(`Invalid chainLock for height ${chainLock.height} against SML on height ${smlStore.tipHeight}`);

        throw new InvalidArgumentAbciError(
          'Signature invalid for chainLock', chainLock.toJSON(),
        );
      }

      logger.debug(`ChainLock is valid for height ${chainLock.height} against SML on height ${smlStore.tipHeight}`);

      return new ResponseQuery();
    }

    let isVerified;
    try {
      ({ result: isVerified } = await coreRpcClient.verifyChainLock(
        chainLock.blockHash.toString('hex'),
        chainLock.signature.toString('hex'),
        chainLock.height,
      ));
    } catch (e) {
      // Invalid signature format
      if ([-8].includes(e.code)) {
        return false;
      }

      throw e;
    }

    if (!isVerified) {
      logger.debug(`Invalid chainLock for height ${chainLock.height}`);

      throw new InvalidArgumentAbciError(
        'Signature invalid for chainLock', chainLock.toJSON(),
      );
    }

    logger.debug(`ChainLock is valid for height ${chainLock.height}`);

    return new ResponseQuery();
  }

  return verifyChainLockQueryHandler;
}

module.exports = verifyChainLockQueryHandlerFactory;
