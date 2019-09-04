/**
 *
 * @param {createSVDocumentMongoDbRepository} createSVDocumentRepository
 * @returns {function(SVContract): Promise<*[]>}
 */
function createContractDatabaseFactory(createSVDocumentRepository) {
  /**
   * Create new collection for each documentType in Contract
   *
   * @param {SVContract} svContract
   * @returns {Promise<*[]>}
   */
  async function createContractDatabase(svContract) {
    const documents = svContract.getContract().getDocuments();
    const contractId = svContract.getContractId();

    const promises = Object.keys(documents).map((documentType) => {
      const svDocumentRepository = createSVDocumentRepository(contractId, documentType);

      return svDocumentRepository.createCollection();
    });

    return Promise.all(promises);
  }

  return createContractDatabase;
}

module.exports = createContractDatabaseFactory;
