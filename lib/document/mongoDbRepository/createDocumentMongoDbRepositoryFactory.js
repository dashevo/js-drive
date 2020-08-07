const DocumentMongoDbRepository = require('./DocumentMongoDbRepository');
const InvalidContractIdError = require('../query/errors/InvalidContractIdError');

/**
 * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
 * @param {validateQuery} validateQuery
 * @param {getDocumentDatabase} getDocumentDatabase
 * @param {DataContractLevelDBRepository} dataContractRepository
 * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
 * @returns {createDocumentMongoDbRepository}
 */
function createDocumentMongoDbRepositoryFactory(
  convertWhereToMongoDbQuery,
  validateQuery,
  getDocumentDatabase,
  dataContractRepository,
  blockExecutionDBTransactions,
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

    const dataContract = await dataContractRepository.fetch(
      dataContractId, blockExecutionDBTransactions.getTransaction('dataContract'),
    );
    if (!dataContract) {
      throw new InvalidContractIdError(dataContractId);
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
