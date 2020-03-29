const InvalidQueryError = require('./errors/InvalidQueryError');
const InvalidDocumentTypeError = require('./query/errors/InvalidDocumentTypeError');
const InvalidContractIdError = require('./query/errors/InvalidContractIdError');
/**
 * @param {createDocumentMongoDbRepository} createDocumentRepository
 * @param {DataContractLevelDBRepository} dataContractRepository
 * @param {LRUCache} dataContractsCache
 * @returns {fetchDocuments}
 */
function fetchDocumentsFactory(
  createDocumentRepository,
  dataContractRepository,
  dataContractsCache,
) {
  /**
   * Fetch original Documents by Contract ID and type
   *
   * @typedef {Promise} fetchDocuments
   * @param {string} contractId
   * @param {string} type
   * @param {Object} [options] options
   * @param {MongoDBTransaction} [dbTransaction]
   * @returns {Document[]}
   */
  async function fetchDocuments(contractId, type, options, dbTransaction = undefined) {
    const documentRepository = createDocumentRepository(contractId, type);

    let dataContract = dataContractsCache.get(contractId);

    if (!dataContract) {
      dataContract = await dataContractRepository.fetch(contractId);

      if (!dataContract) {
        const error = new InvalidContractIdError(contractId);

        throw new InvalidQueryError([error]);
      }

      dataContractsCache.set(contractId, dataContract);
    }

    if (!dataContract.isDocumentDefined(type)) {
      const error = new InvalidDocumentTypeError(type);

      throw new InvalidQueryError([error]);
    }

    const documentSchema = dataContract.getDocumentSchema(type);

    const svDocuments = await documentRepository.fetch(
      options,
      documentSchema,
      dbTransaction,
    );

    return svDocuments.map(svDocument => svDocument.getDocument());
  }

  return fetchDocuments;
}

module.exports = fetchDocumentsFactory;
