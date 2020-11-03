const DocumentsDBTransactionIsAlreadyStartedError = require('./errors/DocumentsDBTransactionIsAlreadyStartedError');
const DocumentsDBTransactionIsNotStartedError = require('./errors/DocumentsDBTransactionIsNotStartedError');

class DocumentsDbTransaction {
  /**
   * @param {MerkDbTransaction} documentsStoreTransaction
   * @param {MongoDBTransaction} documentMongoDBTransaction
   */
  constructor(documentsStoreTransaction, documentMongoDBTransaction) {
    this.storeTransaction = documentsStoreTransaction;
    this.mongoDbTransaction = documentMongoDBTransaction;

    this.isStarted = false;
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

  /**
   * Start new transaction
   */
  async start() {
    if (this.isStarted) {
      throw new DocumentsDBTransactionIsAlreadyStartedError();
    }

    this.storeTransaction.start();
    await this.mongoDbTransaction.start();
  }

  /**
   * Commit transaction
   *
   * @returns {Promise<void>}
   */
  async commit() {
    if (!this.isStarted) {
      throw new DocumentsDBTransactionIsNotStartedError();
    }

    await this.mongoDbTransaction.commit();
    await this.storeTransaction.commit();
  }

  /**
   * Abort current transaction
   *
   * @returns {Promise<void>}
   */
  async abort() {
    await this.mongoDbTransaction.abort();
    await this.storeTransaction.abort();
  }
}

module.exports = DocumentsDbTransaction;
