const Identifier = require('@dashevo/dpp/lib/Identifier');

/**
 *
 * @param {connectToMongoDB} connectToDocumentMongoDB
 * @param {string} documentMongoDBPrefix
 * @return {getDocumentDatabase}
 */
function getDocumentDatabaseFactory(connectToDocumentMongoDB, documentMongoDBPrefix) {
  /**
   * @typedef getDocumentDatabase
   * @param {Buffer} dataContractId
   * @return {Db}
   */
  async function getDocumentDatabase(dataContractId) {
    const documentMongoDBClient = await connectToDocumentMongoDB();
    return documentMongoDBClient.db(`${documentMongoDBPrefix}${new Identifier(dataContractId).toString()}`);
  }

  return getDocumentDatabase;
}

module.exports = getDocumentDatabaseFactory;
