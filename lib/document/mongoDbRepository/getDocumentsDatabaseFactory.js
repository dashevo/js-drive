/**
 *
 * @param {MongoClient} documentsMongoDBClient
 * @param {string} documentsMongoDBPrefix
 * @return {getDocumentsDatabase}
 */
function getDocumentsDatabaseFactory(documentsMongoDBClient, documentsMongoDBPrefix) {
  /**
   * @typedef getDocumentsDatabase
   * @param {string} dataContractId
   * @return {Db}
   */
  function getDocumentsDatabase(dataContractId) {
    return documentsMongoDBClient.db(`${documentsMongoDBPrefix}${dataContractId}`);
  }

  return getDocumentsDatabase;
}

module.exports = getDocumentsDatabaseFactory;
