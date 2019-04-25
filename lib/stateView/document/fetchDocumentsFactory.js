/**
 * @param {createSVDocumentMongoDbRepository} createSVDocumentRepository
 * @param {hydrateSVDocumentForApiResponse} hydrateSVDocumentForApiResponse
 * @returns {fetchDocuments}
 */
function fetchDocumentsFactory(createSVDocumentRepository, hydrateSVDocumentForApiResponse) {
  /**
   * Fetch original Documents by Contract ID and type
   *
   * @typedef {Promise} fetchDocuments
   * @param {string} contractId
   * @param {string} type
   * @param {Object} [options] options
   * @returns {Document[]}
   */
  async function fetchDocuments(contractId, type, options) {
    const svDocumentRepository = createSVDocumentRepository(contractId, type);
    const svDocuments = await svDocumentRepository.fetch(options);
    return svDocuments.map(svDocument => hydrateSVDocumentForApiResponse(svDocument));
  }

  return fetchDocuments;
}

module.exports = fetchDocumentsFactory;
