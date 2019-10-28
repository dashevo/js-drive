const InvalidDocumentTypeError = require('@dashevo/dpp/lib/errors/InvalidDocumentTypeError');

const InvalidQueryError = require('./errors/InvalidQueryError');
const validateIndexedFields = require('./query/validateIndexedFields');
const getIndexedFieldsFromDocumentSchema = require('./getIndexedFieldsFromDocumentSchema');
/**
 * @param {createSVDocumentMongoDbRepository} createSVDocumentRepository
 * @param {SVContractMongoDbRepository} svContractMongoDbRepository
 * @returns {fetchDocuments}
 */
function fetchDocumentsFactory(createSVDocumentRepository, svContractMongoDbRepository) {
  /**
   * Fetch original Documents by Contract ID and type
   *
   * @typedef {Promise} fetchDocuments
   * @param {string} contractId
   * @param {string} type
   * @param {Object} [options] options
   * @param {MongoDBTransaction} [stateViewTransaction]
   * @returns {Document[]}
   */
  async function fetchDocuments(contractId, type, options, stateViewTransaction = undefined) {
    const svDocumentRepository = createSVDocumentRepository(contractId, type);

    let validationResult;
    const svContract = await svContractMongoDbRepository.find(contractId);
    if (!svContract) {
      return [];
    }

    try {
      const dataContract = svContract.getDataContract();
      const documentSchema = dataContract.getDocumentSchema(type);
      const dataContractIndexFields = getIndexedFieldsFromDocumentSchema(documentSchema);

      validationResult = validateIndexedFields(dataContractIndexFields, options);
    } catch (e) {
      if (e instanceof InvalidDocumentTypeError) {
        return [];
      }
    }

    if (!validationResult.isValid()) {
      throw new InvalidQueryError(validationResult.getErrors());
    }

    const svDocuments = await svDocumentRepository.fetch(options, stateViewTransaction);

    return svDocuments.map(svDocument => svDocument.getDocument());
  }

  return fetchDocuments;
}

module.exports = fetchDocumentsFactory;
