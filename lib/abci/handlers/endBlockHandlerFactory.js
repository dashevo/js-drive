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

const { asValue } = require('awilix');

const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');
const NoDashpayContractFoundError = require('./errors/NoDashpayContractFoundError');
const NotFoundAbciError = require('../../abci/errors/NotFoundAbciError');

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
 * @param {container} container
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
  async function endBlockHandler({ height }) {
    logger.info(`Block end #${height}`);

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
      if (smlStore === undefined) {
        logger.debug('EndBlockHandler: SMLStore is not defined');
        throw new Error('EndBlockHandler: SMLStore is not defined');
      }
      const sml = smlStore.getSMLbyHeight(coreChainLock.height);
      const validatorLlmqType = sml.getValidatorLLMQType();

      const validatorQuorumHash = await new ValidatorSet(sml).getHashForCoreHeight(
        Buffer.from(header.lastCommitHash), coreChainLock.height,
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
      logger.trace(`Starting validator set rotation: new quorumHash ${newValidatorSet.quorumHash}`);
    }

    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      logger.trace(`Provide next chain lock for height ${coreChainLock.height}`);

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
    if (newValidatorsUpdates) {
      return new ResponseEndBlock({
        validatorSetUpdate: new ValidatorSetUpdate({
          validatorUpdates: newValidatorsUpdates,
          thresholdPublicKey: new PublicKey({
            bls12381: Uint8Array.from(Buffer.from(newValidatorSet.quorumPublicKey, 'hex')),
          }),
        }),
      });
    }
    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
