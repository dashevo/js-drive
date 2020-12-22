const {
  tendermint: {
    abci: {
      ResponseEndBlock,
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
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @param {getValidatorSetInfo} getValidatorSetInfo
 * @param {LatestCoreChainLock} latestCoreChainLock
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
    // validator set is rotated every ROTATION_BLOCK_INTERVAL blocks
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

    const header = blockExecutionContext.getHeader();
    const coreChainLock = latestCoreChainLock.getChainLock();

    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      logger.trace(`Provide next chain lock for height ${coreChainLock.height}`);

      return new ResponseEndBlock({
        nextCoreChainLockUpdate: new CoreChainLock({
          coreBlockHeight: coreChainLock.height,
          coreBlockHash: coreChainLock.blockHash,
          signature: coreChainLock.signature,
        }),
      });
    }

      const validators = await getValidatorSetInfo(smlStore.currentSML.getValidatorLLMQType(), newValidatorSet.quorumHash);
      if (!validators.length) {
        // this should never happen
        throw new NotFoundAbciError('No validator info found');
      }

      const validatorUpdates = fillValidatorUpdates(validators);

      const validatorRotationResponse = new ResponseEndBlock();
      validatorRotationResponse.validatorUpdates = validatorUpdates;
      logger.info(`Starting validator set rotation: new quorumHash ${newValidatorSet.quorumHash}`);
      return validatorRotationResponse;
    }
    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
