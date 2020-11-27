const DocumentMongoDbRepository = require('./DocumentMongoDbRepository');
const InvalidContractIdError = require('../query/errors/InvalidContractIdError');

/**
 * @param {convertWhereToMongoDbQuery} convertWhereToMongoDbQuery
 * @param {validateQuery} validateQuery
 * @param {getDocumentDatabase} getDocumentMongoDBDatabase
 * @param {DataContractStoreRepository} dataContractRepository
 * @returns {createDocumentMongoDbRepository}
 */
function createDocumentMongoDbRepositoryFactory(
  convertWhereToMongoDbQuery,
  validateQuery,
  getDocumentMongoDBDatabase,
  dataContractRepository,
  container,
  previous = false,
) {
  /**
   * Create DocumentMongoDbRepository
   *
   * @typedef {Promise} createDocumentMongoDbRepository
   * @param {Identifier} dataContractId
   * @param {string} documentType
   * @returns {Promise<DocumentMongoDbRepository>}
   */
  async function createDocumentMongoDbRepository(dataContractId, documentType) {
    const documentsMongoDBDatabase = await getDocumentMongoDBDatabase(dataContractId);

    let blockExecutionStoreTransactions;

    if (previous) {
      blockExecutionStoreTransactions = container.resolve('previousBlockExecutionStoreTransactions');
    } else {
      blockExecutionStoreTransactions = container.resolve('blockExecutionStoreTransactions');
    }

    const tx = blockExecutionStoreTransactions.getTransaction('dataContracts');

    // As documents are always created in the next block
    // we don't need transaction for data contracts here
    const dataContract = await dataContractRepository.fetch(
      dataContractId, tx,
    );

    if (!dataContract) {
      throw new InvalidContractIdError(dataContractId);
    }

    return new DocumentMongoDbRepository(
      documentsMongoDBDatabase,
      convertWhereToMongoDbQuery,
      validateQuery,
      dataContract,
      documentType,
    );
  }

  return createDocumentMongoDbRepository;
}

module.exports = createDocumentMongoDbRepositoryFactory;
