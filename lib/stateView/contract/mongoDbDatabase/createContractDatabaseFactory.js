/**
 *
 * @param {SVDocumentMongoDbRepository} svDocumentRepository
 * @returns {function(SVContract): Promise<*[]>}
 */
function createContractDatabaseFactory(svDocumentRepository) {
  /**
   *
   * @param {SVContract} svContract
   * @returns {Promise<*[]>}
   */
  async function createContractDatabase(svContract) {
    const documents = svContract.getContract().getDocuments();

    const promises = Object.keys(documents)
      .map(documentType => svDocumentRepository.createCollection(documentType));

    return Promise.all(promises);
  }

  return createContractDatabase;
}

module.exports = createContractDatabaseFactory;
