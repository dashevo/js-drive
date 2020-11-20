const MerkDBTransactionIsNotStartedError = require('../merkDb/errors/MerkDBTransactionIsNotStartedError');

/**
 * @param {DocumentDatabaseManager} documentDatabaseManager
 * @param {DashPlatformProtocol} transactionalDpp
 *
 * @return {createDocumentDbFromStoreTransaction}
 */
function createDocumentDbFromStoreTransactionFactory(
  documentDatabaseManager,
  transactionalDpp,
) {
  /**
   * @typedef createDocumentDbFromStoreTransaction
   *
   * @param {MerkDbTransaction} transaction
   *
   * @return {Promise<void>}
   */
  async function createDocumentDbFromStoreTransaction(transaction) {
    if (!transaction.isStarted()) {
      throw new MerkDBTransactionIsNotStartedError();
    }

    const createOperationsData = [...transaction.db.data.entries()];

    const createOperations = createOperationsData.map(async ([, serializedDataContract]) => {
      const dataContract = await transactionalDpp.dataContract.createFromBuffer(
        serializedDataContract,
        {
          skipValidation: true,
        },
      );

      await documentDatabaseManager.create(dataContract);
    });

    await Promise.all(createOperations);
  }

  return createDocumentDbFromStoreTransaction;
}

module.exports = createDocumentDbFromStoreTransactionFactory;
