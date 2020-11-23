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
  previousDocumentDatabaseManager,
  transactionalDpp,
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

      // If the current block is higher than 1 we need to obtain previous block data
      let previousBlockExecutionStoreTransactions;
      if (blockHeight > 1) {
        if (container.has('previousBlockExecutionStoreTransactions')) {
          previousBlockExecutionStoreTransactions = container.resolve('previousBlockExecutionStoreTransactions')
        } else {
          // If container doesn't have previous transactions, load them from file (node cold start)
          previousBlockExecutionStoreTransactions = (
            await previousBlockExecutionStoreTransactionsRepository.fetch()
          );

          if (!previousBlockExecutionStoreTransactions) {
            throw new Error();
          }
        }
      }

      // Clone changes from the current block to previous transactions
      const nextPreviousBlockExecutionStoreTransactions = blockExecutionStoreTransactions.clone();

      // Commit the current block db transactions
      await blockExecutionStoreTransactions.commit();

      // Commit previous block data
      if (previousBlockExecutionStoreTransactions) {
        // Create document databases in previous dbs
        const previousDataContractTransaction = previousBlockExecutionStoreTransactions.getTransaction('dataContract');
        const { updates: previousCreatedDataContracts } = previousDataContractTransaction.toObject();

        const createDatabasePromises = Object.values(previousCreatedDataContracts)
          .map(async (serializedDataContract) => {
            const dataContract = await transactionalDpp.dataContract.createFromBuffer(
              serializedDataContract,
              {
                skipValidation: true,
              },
            );

            await previousDocumentDatabaseManager.create(dataContract);
          });

        await Promise.all(createDatabasePromises);

        // Commit previous block changes from the previous db transactions to previous databases
        await previousBlockExecutionStoreTransactions.commit();
      }

      // Update and persist previous changes with changes from the current block
      container.register({
        previousBlockExecutionStoreTransactions: asValue(nextPreviousBlockExecutionStoreTransactions),
      });

      previousBlockExecutionStoreTransactionsRepository.store(nextPreviousBlockExecutionStoreTransactions);
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
