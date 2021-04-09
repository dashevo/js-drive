const {
  tendermint: {
    abci: {
      ResponseEndBlock,
      ValidatorSetUpdate,
      QuorumHashUpdate,
    },
    crypto: {
      PublicKey,
    },
    types: {
      CoreChainLock,
    },
  },
} = require('@dashevo/abci/types');

const { asValue } = require('awilix');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');
const NoDashpayContractFoundError = require('./errors/NoDashpayContractFoundError');
const NotFoundAbciError = require('../errors/NotFoundAbciError');

const ValidatorSet = require('../../validatorSet/ValidatorSet');

const ROTATION_BLOCK_INTERVAL = 15;

/**
 * Begin block ABCI handler
 *
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {number|undefined} dpnsContractBlockHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {number|undefined} dashpayContractBlockHeight
 * @param {Identifier|undefined} dashpayContractId
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {getValidatorSetInfo} getValidatorSetInfo
 * @param {BaseLogger} logger
 * @param {AwilixContainer} container
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockExecutionContext,
  dpnsContractBlockHeight,
  dpnsContractId,
  dashpayContractBlockHeight,
  dashpayContractId,
  simplifiedMasternodeList,
  getValidatorSetInfo,
  latestCoreChainLock,
  logger,
  container,
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

    let newValidatorSet = null;
    let newValidatorsUpdates = null;
    // validator set is rotated every ROTATION_BLOCK_INTERVAL blocks
    if (height % ROTATION_BLOCK_INTERVAL === 0) {
      const smlStore = simplifiedMasternodeList.getStore();
      const sml = smlStore.getSMLbyHeight(coreChainLock.height);
      const validatorLlmqType = sml.getValidatorLLMQType();

      const validatorQuorumHash = await new ValidatorSet(sml).getHash(
        Buffer.from(header.lastCommitHash),
      );

      container.register({
        validatorQuorumHash: asValue(validatorQuorumHash),
      });

      newValidatorSet = sml.getQuorum(validatorLlmqType, validatorQuorumHash);

      const validators = await getValidatorSetInfo(validatorLlmqType, newValidatorSet.quorumHash);
      if (!validators || !validators.length) {
        // this should never happen
        throw new NotFoundAbciError('No validator info found');
      }

      newValidatorsUpdates = ValidatorSet.fillValidatorUpdates(validators);
      consensusLogger.trace(`Starting validator set rotation: new quorumHash ${newValidatorSet.quorumHash}`);
    }

    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      consensusLogger.trace(
        {
          nextCoreChainLockHeight: coreChainLock.height,
        },
        `Provide next chain lock for Core height ${coreChainLock.height}`,
      );

      if (newValidatorsUpdates) {
        return new ResponseEndBlock({
          nextCoreChainLockUpdate: new CoreChainLock({
            coreBlockHeight: coreChainLock.height,
            coreBlockHash: coreChainLock.blockHash,
            signature: coreChainLock.signature,
          }),
          validatorSetUpdate: new ValidatorSetUpdate({
            validatorUpdates: newValidatorsUpdates,
            thresholdPublicKey: new PublicKey({
              bls12381: Uint8Array.from(Buffer.from(newValidatorSet.quorumPublicKey, 'hex')),
            }),
            quorumHash: Buffer.from(newValidatorSet.quorumHash, 'hex'),
          }),
        });
      }
      return new ResponseEndBlock({
        nextCoreChainLockUpdate: new CoreChainLock({
          coreBlockHeight: coreChainLock.height,
          coreBlockHash: coreChainLock.blockHash,
          signature: coreChainLock.signature,
        }),
      });
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

    if (newValidatorsUpdates) {
      return new ResponseEndBlock({
        validatorSetUpdate: new ValidatorSetUpdate({
          validatorUpdates: newValidatorsUpdates,
          thresholdPublicKey: new PublicKey({
            bls12381: Uint8Array.from(Buffer.from(newValidatorSet.quorumPublicKey, 'hex')),
          }),
          quorumHash: Buffer.from(newValidatorSet.quorumHash, 'hex'),
        }),
      });
    }
    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
