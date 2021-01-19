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
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestBeginBlock} request
   *
   * @return {Promise<abci.ResponseBeginBlock>}
   */
  async function endBlockHandler({ height }) {
    const validTxCount = blockExecutionContext.getValidTxCount();
    const invalidTxCount = blockExecutionContext.getInvalidTxCount();

    const consensusLogger = logger.child({
      height,
      validTxCount,
      invalidTxCount,
      abciMethod: 'endBlock',
    });

    blockExecutionContext.setConsensusLogger(consensusLogger);

    consensusLogger.info(
      `Block end #${height} (valid txs = ${validTxCount}, invalid txs = ${invalidTxCount})`,
    );

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

    if (coreChainLock && coreChainLock.height > header.coreChainLockedHeight) {
      consensusLogger.trace(
        {
          nextCoreChainLockHeight: coreChainLock.height,
        },
        `Provide next chain lock for Core height ${coreChainLock.height}`,
      );

      return new ResponseEndBlock({
        nextCoreChainLockUpdate: new CoreChainLock({
          coreBlockHeight: coreChainLock.height,
          coreBlockHash: coreChainLock.blockHash,
          signature: coreChainLock.signature,
        }),
      });
    }

    return new ResponseEndBlock();
  }

  return endBlockHandler;
}

module.exports = endBlockHandlerFactory;
