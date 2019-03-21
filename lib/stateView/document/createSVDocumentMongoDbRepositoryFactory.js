const bs58 = require('bs58');

const PREFIX = 'dpa_';

/**
 * @param {MongoClient} mongoClient
 * @param {SVDocumentMongoDbRepository} SVDocumentMongoDbRepository
 * @param {sanitizer} sanitizer
 * @returns {createSVDocumentMongoDbRepository}
 */
function createSVDocumentMongoDbRepositoryFactory(
  mongoClient,
  SVDocumentMongoDbRepository,
  sanitizer,
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
    const contractIdEncoded = bs58.encode(Buffer.from(contractId, 'hex'));
    const mongoDb = mongoClient.db(`${process.env.MONGODB_DB_PREFIX}${PREFIX}${contractIdEncoded}`);
    return new SVDocumentMongoDbRepository(mongoDb, sanitizer, documentType);
  }

  return createSVDocumentMongoDbRepository;
}

module.exports = createSVDocumentMongoDbRepositoryFactory;
