const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

const Long = require('long');
const { asValue } = require('awilix');
const NoPreviousBlockExecutionStoreTransactionsFoundError = require('./errors/NoPreviousBlockExecutionStoreTransactionsFoundError');
const DataCorruptedError = require('./errors/DataCorruptedError');

/**
 * @param {ChainInfo} chainInfo
 * @param {ChainInfoCommonStoreRepository} chainInfoRepository
 * @param {BlockExecutionStoreTransactions} blockExecutionStoreTransactions
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {DocumentDatabaseManager} documentDatabaseManager
 * @param {DocumentDatabaseManager} previousDocumentDatabaseManager
 * @param {DashPlatformProtocol} transactionalDpp
 * @param {RootTree} rootTree
 * @param {
 * PreviousBlockExecutionStoreTransactionsRepository
 * } previousBlockExecutionStoreTransactionsRepository
 * @param {populateMongoDbTransactionFromObject} populateMongoDbTransactionFromObject
 * @param {AwilixContainer} container
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
  previousBlockExecutionStoreTransactionsRepository,
  populateMongoDbTransactionFromObject,
  container,
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
    const { height: blockHeight } = blockExecutionContext.getHeader();

    logger.info(`Block commit #${blockHeight}`);

    // If the current block is higher than 1 we need to obtain previous block data
    let previousBlockExecutionStoreTransactions;
    if (blockHeight > 1) {
      if (container.has('previousBlockExecutionStoreTransactions')) {
        previousBlockExecutionStoreTransactions = container.resolve('previousBlockExecutionStoreTransactions');
      } else {
        // If container doesn't have previous transactions, load them from file (node cold start)
        previousBlockExecutionStoreTransactions = (
          await previousBlockExecutionStoreTransactionsRepository.fetch()
        );

        if (!previousBlockExecutionStoreTransactions) {
          throw new NoPreviousBlockExecutionStoreTransactionsFoundError();
        }
      }
    }

    let nextPreviousBlockExecutionStoreTransactions;
    try {
      // Create document databases for dataContracts created in the current block
      for (const dataContract of blockExecutionContext.getDataContracts()) {
        await documentDatabaseManager.create(dataContract);
      }

      // Store ST fees from the block to distribution pool
      chainInfo.setCreditsDistributionPool(blockExecutionContext.getAccumulativeFees());

      const commonStoreTransaction = blockExecutionStoreTransactions.getTransaction('common');

      await chainInfoRepository.store(chainInfo, commonStoreTransaction);

      // Clone changes from the current block to previous transactions
      nextPreviousBlockExecutionStoreTransactions = blockExecutionStoreTransactions.clone();

      // Commit the current block db transactions
      await blockExecutionStoreTransactions.commit();
    } catch (e) {
      // Abort DB transactions. It doesn't work since some of transaction may already be committed
      // and will produce "transaction in not started" error.
      await blockExecutionStoreTransactions.abort();

      for (const dataContract of blockExecutionContext.getDataContracts()) {
        await documentDatabaseManager.drop(dataContract);
      }

      throw e;
    } finally {
      // Reset block execution state
      blockExecutionContext.reset();
    }

    rootTree.rebuild();

    // Commit previous block data
    if (previousBlockExecutionStoreTransactions) {
      // Create document databases in previous dbs
      const previousDataContractTransaction = previousBlockExecutionStoreTransactions.getTransaction('dataContracts');
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

      const previousDocumentsTransaction = previousBlockExecutionStoreTransactions.getTransaction('documents');

      await populateMongoDbTransactionFromObject(
        previousDocumentsTransaction.getMongoDbTransaction(),
        previousDocumentsTransaction.toObject(),
      );

      // Commit previous block changes from the previous db transactions to previous databases
      await previousBlockExecutionStoreTransactions.commit();
    }

    // Update and persist previous changes with changes from the current block
    container.register({
      previousBlockExecutionStoreTransactions: asValue(nextPreviousBlockExecutionStoreTransactions),
    });

    // In case of failure the block won't be committed but the current state will be updated
    // since previous state won't have changes from H-1. info handler will provide
    // height of the current block so data from H-1 will be just lost in previous databases.
    try {
      previousBlockExecutionStoreTransactionsRepository.store(
        nextPreviousBlockExecutionStoreTransactions,
      );
    } catch (e) {
      // Break syncing to force user to reset.
      chainInfo.setLastBlockHeight(Long.fromInt(0));
      chainInfoRepository.store(chainInfo);

      const commonStoreTransaction = blockExecutionStoreTransactions.getTransaction('common');

      await chainInfoRepository.store(chainInfo, commonStoreTransaction);

      logger.error(e);

      throw new DataCorruptedError();
    }

    return new ResponseCommit({
      data: rootTree.getRootHash(),
    });
  }

  return commitHandler;
}

module.exports = commitHandlerFactory;
