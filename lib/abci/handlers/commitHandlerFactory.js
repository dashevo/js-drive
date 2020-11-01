const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

/**
 * @param {ChainInfo} chainInfo
 * @param {ChainInfoLevelDBRepository} chainInfoRepository
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @param {BlockExecutionState} blockExecutionState
 * @param {DocumentDatabaseManager} documentDatabaseManager
 * @param {BaseLogger} logger
 *
 * @return {commitHandler}
 */
function commitHandlerFactory(
  chainInfo,
  chainInfoRepository,
  blockExecutionDBTransactions,
  blockExecutionState,
  documentDatabaseManager,
  logger,
) {
  /**
   * Commit ABCI handler
   *
   * @typedef commitHandler
   *
   * @return {Promise<abci.ResponseCommit>}
   */
  async function commitHandler() {
    const { height: blockHeight } = blockExecutionState.getHeader();

    logger.info(`Block commit #${blockHeight}`);

    // We don't build state tree for now
    // so appHash always empty
    const appHash = Buffer.alloc(0);

    try {
      // Create document databases for dataContracts created in the current block
      for (const dataContract of blockExecutionState.getDataContracts()) {
        await documentDatabaseManager.create(dataContract);
      }

      // Commit DB transactions
      await blockExecutionDBTransactions.commit();

      // Update blockchain state
      chainInfo.setLastBlockAppHash(appHash);

      // Store ST fees from the block to distribution pool
      chainInfo.setCreditsDistributionPool(blockExecutionState.getAccumulativeFees());

      await chainInfoRepository.store(chainInfo);
    } catch (e) {
      // Abort DB transactions
      await blockExecutionDBTransactions.abort();

      for (const dataContract of blockExecutionState.getDataContracts()) {
        await documentDatabaseManager.drop(dataContract);
      }

      throw e;
    } finally {
      // Reset block execution state
      blockExecutionState.reset();
    }

    return new ResponseCommit({
      data: appHash,
    });
  }

  return commitHandler;
}

module.exports = commitHandlerFactory;
