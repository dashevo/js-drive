const DocumentMongoDbRepository = require('./DocumentMongoDbRepository');
const DataContractNotFoundError = require('../../dataContract/errors/DataContractNotFoundError');

/**
 * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
 * @param {validateQuery} validateQuery
 * @param {getDocumentDatabase} getDocumentDatabase
 * @param {DataContractLevelDBRepository} dataContractRepository
 * @returns {createDocumentMongoDbRepository}
 */
function createDocumentMongoDbRepositoryFactory(
  convertWhereToMongoDbQuery,
  validateQuery,
  getDocumentDatabase,
  dataContractRepository,
) {
  /**
   * Create DocumentMongoDbRepository
   *
   * @typedef {Promise} createDocumentMongoDbRepository
   * @param {string} dataContractId
   * @param {string} documentType
   * @returns {Promise<DocumentMongoDbRepository>}
   */
  async function createDocumentMongoDbRepository(dataContractId, documentType) {
    const documentsMongoDatabase = await getDocumentDatabase(dataContractId);

    const dataContract = await dataContractRepository.fetch(dataContractId);
    if (!dataContract) {
      throw new DataContractNotFoundError(dataContractId);
    }

    return new DocumentMongoDbRepository(
      documentsMongoDatabase,
      convertWhereToMongoDbQuery,
      validateQuery,
      dataContract,
      documentType,
    );
  }

  return createDocumentMongoDbRepository;
}

module.exports = createDocumentMongoDbRepositoryFactory;
