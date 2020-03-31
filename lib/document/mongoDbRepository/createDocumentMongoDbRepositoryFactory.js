const DocumentMongoDbRepository = require('./DocumentMongoDbRepository');

/**
 * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
 * @param {validateQuery} validateQuery
 * @param {getDocumentsDatabase} getDocumentsDatabase
 * @returns {createDocumentMongoDbRepository}
 */
function createDocumentMongoDbRepositoryFactory(
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
    const documentsMongoDatabase = getDocumentsDatabase(dataContractId);

    return new DocumentMongoDbRepository(
      documentsMongoDatabase,
      convertWhereToMongoDbQuery,
      validateQuery,
      dataContractId,
      documentType,
    );
  }

  return createDocumentMongoDbRepository;
}

module.exports = createDocumentMongoDbRepositoryFactory;
