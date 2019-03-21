/**
 * @param {createSVObjectMongoDbRepository} createSVObjectRepository
 * @returns {fetchDocuments}
 */
function fetchDocumentsFactory(createSVObjectRepository) {
  /**
   * Fetch original DP Objects by Contract ID and type
   *
   * @typedef {Promise} fetchDocuments
   * @param {string} contractId
   * @param {string} type
   * @param {Object} [options] options
   * @returns {DPObject[]}
   */
  async function fetchDocuments(contractId, type, options) {
    const svObjectRepository = createSVObjectRepository(contractId, type);
    const svObjects = await svObjectRepository.fetch(options);
    return svObjects.map(svObject => svObject.getDPObject());
  }

  return fetchDocuments;
}

module.exports = fetchDocumentsFactory;
