const DocumentsDBTransactionIsNotStartedError = require('./errors/DocumentsDBTransactionIsNotStartedError');

/**
 * @param {createDocumentMongoDbRepository} createPreviousDocumentMongoDbRepository
 * @param {DashPlatformProtocol} transactionalDpp
 *
 * @return {populateMongoDbTransactionFromObject}
 */
function populateMongoDbTransactionFromObjectFactory(
  createPreviousDocumentMongoDbRepository,
  transactionalDpp,
) {
  /**
   * @typedef populateMongoDbTransactionFromObject
   * @param {MongoDBTransaction} transaction
   * @param {RawStoreTransaction} transactionObject
   * @return {Promise<void>}
   */
  async function populateMongoDbTransactionFromObject(transaction, transactionObject) {
    if (!transaction.isStarted()) {
      throw new DocumentsDBTransactionIsNotStartedError();
    }

    const updateOperations = Object.values(transactionObject.updates)
      .map(async (serializedDocument) => {
        const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
          skipValidation: true,
        });

        const mongoDbRepository = await createPreviousDocumentMongoDbRepository(
          document.getDataContractId(),
          document.getType(),
        );

        await mongoDbRepository.store(document, transaction);
      });

    const deleteOperations = Object.entries(transactionObject.deletes)
      .map(async ([documentId, serializedDocument]) => {
        const document = await transactionalDpp.document.createFromBuffer(serializedDocument, {
          skipValidation: true,
        });

        const mongoDbRepository = await createPreviousDocumentMongoDbRepository(
          document.getDataContractId(),
          document.getType(),
        );

        await mongoDbRepository.delete(documentId, transaction);
      });

    await Promise.all(updateOperations.concat(deleteOperations));
  }

  return populateMongoDbTransactionFromObject;
}

module.exports = populateMongoDbTransactionFromObjectFactory;
