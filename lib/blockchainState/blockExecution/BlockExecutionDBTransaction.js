class BlockExecutionDBTransaction {
  /**
   *
   * @param {LevelDBTransaction} identityTransaction
   * @param {MongoDBTransaction} documentTransaction
   * @param {LevelDBTransaction} dataContractTransaction
   */
  constructor(identityTransaction, documentTransaction, dataContractTransaction) {
    this.transactions = {
      identity: identityTransaction,
      document: documentTransaction,
      dataContract: dataContractTransaction,
    };
  }

  /**
   * Start transactions
   *
   * @return {[*]}
   */
  start() {
    return Object.values(this.transactions).map((t) => t.start());
  }

  /**
   * Commit transactions
   *
   * @return {Promise<[LevelDBTransaction]>}
   */
  async commit() {
    return Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.commit()),
    );
  }

  /**
   * Abort transactions
   *
   * @return {Promise<*[]>}
   */
  async abort() {
    return Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.abort()),
    );
  }

  /**
   * Get transaction by name
   *
   * @return {LevelDBTransaction|MongoDBTransaction}
   */
  getTransaction(name) {
    return this.transactions[name];
  }
}

module.exports = BlockExecutionDBTransaction;
