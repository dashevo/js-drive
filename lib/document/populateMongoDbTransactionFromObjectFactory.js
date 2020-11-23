const DocumentsDBTransactionIsNotStartedError = require('./errors/DocumentsDBTransactionIsNotStartedError');

/**
 * @param {getDocumentMongoDbDatabase} getDocumentMongoDbDatabase
 * @param {DashPlatformProtocol} transactionalDpp
 *
 * @return {updateMongoDbFromStoreTransaction}
 */
function populateMongoDbTransactionFromObjectFactory(
  getDocumentMongoDbDatabase,
  transactionalDpp,
) {
  /**
   * @typedef updateMongoDbFromStoreTransaction
   * @param {MongoDBTransaction} transaction
   * @param {RawStoreTransaction} transactionObject
   * @return {Promise<void>}
   */
  async function populateMongoDbTransactionFromObject(transaction, transactionObject) {
    if (!transaction.isStarted()) {
      throw new DocumentsDBTransactionIsNotStartedError();
    }

    const updateOperations = Object.entries(transactionObject.updates).map(async ([, serializedDocument]) => {
      const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
        skipValidation: true,
      });

      // TODO It suppose to be repository, not database (createDocumentMongoDbRepository?)
      const mongoDb = await getDocumentMongoDbDatabase(document.getDataContractId());

      await mongoDb.store(document, transaction);
    });

    const deleteOperations = Object.entries(transactionObject.deletes).map(async ([documentId, serializedDocument]) => {
      const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
        skipValidation: true,
      });

      // TODO It suppose to be repository, not database (createDocumentMongoDbRepository?)
      const mongoDb = await getDocumentMongoDbDatabase(document.getDataContractId());

      await mongoDb.delete(documentId, transaction);
    });

    await Promise.all(updateOperations.concat(deleteOperations));
  }

  return populateMongoDbTransactionFromObject;
}

module.exports = populateMongoDbTransactionFromObjectFactory;
