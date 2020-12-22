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
const Validators = require('@dashevo/js-drive-light-client/lib/validators/Validators');
const NoDPNSContractFoundError = require('./errors/NoDPNSContractFoundError');
const NotFoundAbciError = require('.errors/NotFoundAbciError');
const fillValidatorUpdates = require('../../util/fillValidatorUpdates');

const ROTATION_BLOCK_INTERVAL = 15;

/**
 * End Block ABCI Handler
 *
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {number|undefined} dpnsContractBlockHeight
 * @param {Identifier|undefined} dpnsContractId
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {getValidatorSetInfo} getValidatorSetInfo
 * @param {BaseLogger} logger
 *
 * @return {endBlockHandler}
 */
function endBlockHandlerFactory(
  blockExecutionContext,
  dpnsContractBlockHeight,
  dpnsContractId,
  latestCoreChainLock,
  simplifiedMasternodeList,
  getValidatorSetInfo,
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

    const header = blockExecutionContext.getHeader();
    const coreChainLock = latestCoreChainLock.getChainLock();

    let newValidatorSet = null;
    let newValidatorsUpdates = null;
    // validator set is rotated every ROTATION_BLOCK_INTERVAL blocks
    if (height % ROTATION_BLOCK_INTERVAL === 0) {
      const rotationEntropy = header.lastCommitHash;
      const smlStore = simplifiedMasternodeList.getStore();
      if (smlStore === undefined) {
        logger.debug('SMLStore is not defined');
        throw new Error('SMLStore is not defined');
      }

      newValidatorSet = new Validators(smlStore).getValidatorSetForCoreHeight(
        Buffer.from(rotationEntropy), coreChainLock.height, false,
      );

      const validators = await getValidatorSetInfo(smlStore.currentSML.getValidatorLLMQType(), newValidatorSet.quorumHash);
      if (!validators.length) {
        // this should never happen
        throw new NotFoundAbciError('No validator info found');
      }

      newValidatorsUpdates = fillValidatorUpdates(validators);
      logger.trace(`Starting validator set rotation: new quorumHash ${newValidatorSet.quorumHash}`);
    }

    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      logger.trace(`Provide next chain lock for height ${coreChainLock.height}`);

      if (newValidatorSet) {
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
    if (newValidatorSet) {
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
