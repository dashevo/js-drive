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
   */
  async function updateMongoDbFromStoreTransaction(transaction) {
    if (!transaction.isStarted()) {
      throw new DocumentsDBTransactionIsNotStartedError();
    }

    const createOperationsData = transaction.db.data.entries;
    const deleteOperationsData = transaction.db.data.deleted;

    const createOperations = createOperationsData.map(async (_, serializedDocument) => {
      const document = await transactionalDpp.documents.createFromBuffer(serializedDocument, {
        skipValidation: true,
      });

      const mongoDb = await getDocumentMongoDbDatabase(document.getDataContractId());

      await mongoDb.store(document);
    });

    const deleteOperations = deleteOperationsData.map((documentId) => {
      // TODO: nothing works since we don't have any dataContractId
    });

    await Promise.all(createOperations);
  }

  return updateMongoDbFromStoreTransaction;
}

module.exports = updateMongoDbFromStoreTransactionFactory;
