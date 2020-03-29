class BlockExecutionDBTransactions {
  /**
   *
   * @param {LevelDBTransaction} identitiesTransaction
   * @param {MongoDBTransaction} documentsTransaction
   * @param {LevelDBTransaction} dataContractsTransaction
   */
  constructor(identitiesTransaction, documentsTransaction, dataContractsTransaction) {
    this.transactions = {
      identities: identitiesTransaction,
      documents: documentsTransaction,
      dataContracts: dataContractsTransaction,
    };
  }

  /**
   * Start transactions
   */
  start() {
    Object.values(this.transactions).forEach(t => t.start());
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
        .map(transaction => transaction.commit()),
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
        .map(transaction => transaction.abort()),
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

module.exports = BlockExecutionDBTransactions;
