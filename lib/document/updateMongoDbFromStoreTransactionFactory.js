const DocumentsDBTransactionIsNotStartedError = require('./errors/DocumentsDBTransactionIsNotStartedError');

/**
 * @param {getDocumentMongoDbDatabase} getDocumentMongoDbDatabase
 * @param {DashPlatformProtocol} transactionalDpp
 *
 * @return {updateMongoDbFromStoreTransaction}
 */
function updateMongoDbFromStoreTransactionFactory(
  getDocumentMongoDbDatabase,
  transactionalDpp,
) {
  /**
   * @typedef updateMongoDbFromStoreTransaction
   *
   * @param {DocumentsDbTransaction} transaction
   *
   * @return {Promise<void>}
   */
  async function updateMongoDbFromStoreTransaction(transaction) {
    if (!transaction.isStarted()) {
      throw new DocumentsDBTransactionIsNotStartedError();
    }

    const createOperationsData = [...transaction.storeTransaction.db.data.entries()];
    const deleteOperationsData = [...transaction.storeTransaction.db.deleted.entries()];

    const createOperations = createOperationsData.map(async ([, serializedDocument]) => {
      const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
        skipValidation: true,
      });

      const mongoDb = await getDocumentMongoDbDatabase(document.getDataContractId());

      await mongoDb.store(document);
    });

    const deleteOperations = deleteOperationsData.map(async ([documentId, serializedDocument]) => {
      const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
        skipValidation: true,
      });

      const mongoDb = await getDocumentMongoDbDatabase(document.getDataContractId());

      await mongoDb.delete(documentId);
    });

    await Promise.all(createOperations.concat(deleteOperations));
  }

  return updateMongoDbFromStoreTransaction;
}

module.exports = updateMongoDbFromStoreTransactionFactory;
