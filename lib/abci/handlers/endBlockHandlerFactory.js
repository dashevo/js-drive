const {
  tendermint: {
    abci: {
      ResponseEndBlock,
      ValidatorSetUpdate,
    },
    crypto: {
      PublicKey,
    },
    types: {
      CoreChainLock,
    },
  },
} = require('@dashevo/abci/types');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');
const NoDashpayContractFoundError = require('./errors/NoDashpayContractFoundError');

/**
 * Begin block ABCI handler
 *
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {number|undefined} dpnsContractBlockHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {number|undefined} dashpayContractBlockHeight
 * @param {Identifier|undefined} dashpayContractId
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {ValidatorQuorums} validatorQuorums
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockExecutionContext,
  dpnsContractBlockHeight,
  dpnsContractId,
  dashpayContractBlockHeight,
  dashpayContractId,
  latestCoreChainLock,
  validatorQuorums,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestEndBlock} request
   * @return {Promise<abci.ResponseEndBlock>}
   */
  async function endBlockHandler(request) {
    const { height } = request;

    const consensusLogger = logger.child({
      height: height.toString(),
      abciMethod: 'endBlock',
    });

    consensusLogger.debug('EndBlock ABCI method requested');

    blockExecutionContext.setConsensusLogger(consensusLogger);

    if (dpnsContractId && height === dpnsContractBlockHeight) {
      if (!blockExecutionContext.hasDataContract(dpnsContractId)) {
        throw new NoDPNSContractFoundError(dpnsContractId, dpnsContractBlockHeight);
      }
    }

    if (dashpayContractId && height === dashpayContractBlockHeight) {
      if (!blockExecutionContext.hasDataContract(dashpayContractId)) {
        throw new NoDashpayContractFoundError(dashpayContractId, dashpayContractBlockHeight);
      }
    }

    const header = blockExecutionContext.getHeader();
    const coreChainLock = latestCoreChainLock.getChainLock();

    let validatorSetUpdate;
    if (await validatorQuorums.rotate(height, header.lastCommitHash)) {
      const validatorSet = validatorQuorums.getValidatorSet();

      validatorSetUpdate = new ValidatorSetUpdate({
        validatorUpdates: validatorQuorums.toABCIValidatorUpdates(),
        thresholdPublicKey: new PublicKey({
          bls12381: Buffer.from(validatorSet.quorumPublicKey, 'hex'),
        }),
        quorumHash: Buffer.from(validatorSet.quorumHash, 'hex'),
      });

      consensusLogger.debug(
        {
          quorumHash: validatorSet.quorumHash.toString('hex'),
        },
        `Validator Set switched to ${validatorSet.quorumHash.toString('hex')} quorum`,
      );
    }

    let nextCoreChainLockUpdate;
    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      nextCoreChainLockUpdate = new CoreChainLock({
        coreBlockHeight: coreChainLock.height,
        coreBlockHash: coreChainLock.blockHash,
        signature: coreChainLock.signature,
      });

      consensusLogger.trace(
        {
          nextCoreChainLockHeight: coreChainLock.height,
        },
        `Provide next chain lock for Core height ${coreChainLock.height}`,
      );
    }

    const validTxCount = blockExecutionContext.getValidTxCount();
    const invalidTxCount = blockExecutionContext.getInvalidTxCount();

    consensusLogger.info(
      {
        validTxCount,
        invalidTxCount,
      },
      `Block end #${height} (valid txs = ${validTxCount}, invalid txs = ${invalidTxCount})`,
    );

    return new ResponseEndBlock({
      validatorSetUpdate,
      nextCoreChainLockUpdate,
    });
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
