class DocumentsDbTransaction {
  /**
   * @param {MerkDbTransaction} documentsStoreTransaction
   * @param {MongoDBTransaction} documentMongoDBTransaction
   */
  constructor(documentsStoreTransaction, documentMongoDBTransaction) {
    this.storeTransaction = documentsStoreTransaction;
    this.mongoDbTransaction = documentMongoDBTransaction;
  }

  /**
   * Get document store transaction
   *
   * @return {MerkDbTransaction}
   */
  getStoreTransaction() {
    return this.storeTransaction;
  }

  /**
   * Get MongoDb transaction
   *
   * @return {MongoDBTransaction}
   */
  getMongoDbTransaction() {
    return this.mongoDbTransaction;
  }

  commit() {

  }

  abort() {

  }
}

module.exports = DocumentsDbTransaction;
