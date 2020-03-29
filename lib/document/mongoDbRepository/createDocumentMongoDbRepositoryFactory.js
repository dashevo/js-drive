const DocumentMongoDbRepository = require('./DocumentMongoDbRepository');

/**
 * @param {MongoClient} documentsMongoDBClient
 * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
 * @param {validateQuery} validateQuery
 * @param {getDocumentsDatabase} getDocumentsDatabase
 * @returns {createDocumentMongoDbRepository}
 */
function createDocumentMongoDbRepositoryFactory(
  documentsMongoDBClient,
  convertWhereToMongoDbQuery,
  validateQuery,
  getDocumentsDatabase,
) {
  /**
   * Create DocumentMongoDbRepository
   *
   * @typedef {Promise} createDocumentMongoDbRepository
   * @param {string} dataContractId
   * @param {string} documentType
   * @returns {DocumentMongoDbRepository}
   */
  function createDocumentMongoDbRepository(dataContractId, documentType) {
    const mongoDb = getDocumentsDatabase(dataContractId);

    return new DocumentMongoDbRepository(
      mongoDb,
      convertWhereToMongoDbQuery,
      validateQuery,
      dataContractId,
      documentType,
    );
  }

  return createDocumentMongoDbRepository;
}

module.exports = createDocumentMongoDbRepositoryFactory;
