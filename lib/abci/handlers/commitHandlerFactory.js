const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

const { asValue } = require('awilix');

/**
 * @param {ChainInfo} chainInfo
 * @param {ChainInfoCommonStoreRepository} chainInfoRepository
 * @param {BlockExecutionStoreTransactions} blockExecutionStoreTransactions
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {DocumentDatabaseManager} documentDatabaseManager
 * @param {RootTree} rootTree
 * @param {BaseLogger} logger
 *
 * @return {commitHandler}
 */
function commitHandlerFactory(
  chainInfo,
  chainInfoRepository,
  blockExecutionStoreTransactions,
  blockExecutionContext,
  documentDatabaseManager,
  rootTree,
  logger,
  previousBlockExecutionStoreTransactionsRepository,
  container,
) {
  /**
   * Commit ABCI handler
   *
   * @typedef commitHandler
   *
   * @return {Promise<abci.ResponseCommit>}
   */
  async function commitHandler() {
    const { height: blockHeight } = blockExecutionContext.getHeader();

    logger.info(`Block commit #${blockHeight}`);

    try {
      // Create document databases for dataContracts created in the current block
      for (const dataContract of blockExecutionContext.getDataContracts()) {
        await documentDatabaseManager.create(dataContract);
      }

      // Store ST fees from the block to distribution pool
      chainInfo.setCreditsDistributionPool(blockExecutionContext.getAccumulativeFees());

      const commonDbTransaction = blockExecutionStoreTransactions.getTransaction('common');

      await chainInfoRepository.store(chainInfo, commonDbTransaction);

      // Clone changes from the current block to previous transactions
      const nextPreviousBlockExecutionDBTransactions = blockExecutionStoreTransactions.clone();

      // Commit the current block db transactions
      await blockExecutionStoreTransactions.commit();

      // If the current block is higher than 1 we need to commit previous block data
      if (blockHeight > 1) {
        let previousBlockExecutionDBTransactions;
        if (container.has('previousBlockExecutionDBTransactions')) {
          previousBlockExecutionDBTransactions = container.resolve('previousBlockExecutionDBTransactions')
        } else {
          // If container doesn't have previous transactions, load them from file (node cold start)
          previousBlockExecutionDBTransactions = (
            await previousBlockExecutionStoreTransactionsRepository.fetch()
          );
        }

        // Create document databases in previous dbs
        const previousDataContractTransaction = previousBlockExecutionDBTransactions.getTransaction('dataContract');

        await createPreviousDocumentDatabasesFromTransactionObject(previousDataContractTransaction.toObject());

        // Commit previous block changes from the previous db transactions to previous databases
        await previousBlockExecutionDBTransactions.commit();
      }

      // Update and persist previous changes with changes from the current block
      container.register({
        previousBlockExecutionDBTransactions: asValue(nextPreviousBlockExecutionDBTransactions),
      });

      previousBlockExecutionStoreTransactionsRepository.store(nextPreviousBlockExecutionDBTransactions);
    } catch (e) {
      // Abort DB transactions
      await blockExecutionStoreTransactions.abort();

      for (const dataContract of blockExecutionContext.getDataContracts()) {
        await documentDatabaseManager.drop(dataContract);
      }

      throw e;
    } finally {
      // Reset block execution state
      blockExecutionContext.reset();
    }

    return new ResponseCommit({
      data: rootTree.getRootHash(),
    });
  }

  return commitHandler;
}

module.exports = commitHandlerFactory;
