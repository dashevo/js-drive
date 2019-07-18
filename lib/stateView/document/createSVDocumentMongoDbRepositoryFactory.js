const PREFIX = 'dpa_';

/**
 * @param {MongoClient} mongoClient
 * @param {SVDocumentMongoDbRepository} SVDocumentMongoDbRepository
 * @returns {createSVDocumentMongoDbRepository}
 */
function createSVDocumentMongoDbRepositoryFactory(
  mongoClient,
  SVDocumentMongoDbRepository,
) {
  /**
   * Create SVDocumentMongoDbRepository
   *
   * @typedef {Promise} createSVDocumentMongoDbRepository
   * @param {string} contractId
   * @param {string} documentType
   * @returns {SVDocumentMongoDbRepository}
   */
  function createSVDocumentMongoDbRepository(contractId, documentType) {
    const mongoDb = mongoClient.db(`${process.env.MONGODB_DB_PREFIX}${PREFIX}${contractId}`);
    return new SVDocumentMongoDbRepository(mongoDb, documentType);
  }

  return createSVDocumentMongoDbRepository;
}

module.exports = createSVDocumentMongoDbRepositoryFactory;
