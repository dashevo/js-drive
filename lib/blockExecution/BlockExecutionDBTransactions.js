class BlockExecutionDBTransactions {
  /**
   *
   * @param {MerkDbTransaction} identitiesTransaction
   * @param {DocumentsDbTransaction} documentsDbTransaction
   * @param {MerkDbTransaction} dataContractsTransaction
   * @param {MerkDbTransaction} publicKeyToIdentityIdTransaction
   * @param {MerkDbTransaction} previousIdentitiesTransaction
   * @param {DocumentsDbTransaction} previousDocumentsDbTransaction
   * @param {MerkDbTransaction} previousDataContractsTransaction
   * @param {MerkDbTransaction} previousPublicKeyToIdentityIdTransaction
   * @param {BlockExecutionTransactionStore} blockExecutionTransactionStore
   */
  constructor(
    identitiesTransaction,
    documentsDbTransaction,
    dataContractsTransaction,
    publicKeyToIdentityIdTransaction,
    previousIdentitiesTransaction,
    previousDocumentsDbTransaction,
    previousDataContractsTransaction,
    previousPublicKeyToIdentityIdTransaction,
    blockExecutionTransactionStore,
  ) {
    this.transactions = {
      identity: identitiesTransaction,
      document: documentsDbTransaction,
      dataContract: dataContractsTransaction,
      publicKeyToIdentityId: publicKeyToIdentityIdTransaction,
    };

    this.previousTransactions = {
      identity: previousIdentitiesTransaction,
      document: previousDocumentsDbTransaction,
      dataContract: previousDataContractsTransaction,
      publicKeyToIdentityId: previousPublicKeyToIdentityIdTransaction,
    };

    this.blockExecutionTransactionStore = blockExecutionTransactionStore;
  }

  /**
   * Start transactions
   */
  async start() {
    await Promise.all(
      Object.values(this.transactions).map((t) => t.start()),
    );
  }

  /**
   * Commit transactions
   *
   * @return {Promise<void>}
   */
  async commit() {
    await Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.commit()),
    );

    await this.blockExecutionTransactionStore.store(this.transactions);
  }

  /**
   * Abort transactions
   *
   * @return {Promise<void>}
   */
  async abort() {
    await Promise.all(
      Object
        .values(this.transactions)
        .map((transaction) => transaction.abort()),
    );
  }

  /**
   * Get transaction by name
   *
   * @return {MerkDbTransaction|MongoDBTransaction}
   */
  getTransaction(name) {
    return this.transactions[name];
  }

  /**
   * Get transactions for previous block if any
   *
   * @return {Promise<{
   * identity: MerkDbTransaction,
   * document: DocumentsDbTransaction,
   * dataContract: MerkDbTransaction,
   * publicKeyToIdentityId: MerkDbTransaction}>}
   */
  async getPreviousTransactions() {
    await this.blockExecutionTransactionStore.fetchAndUpdate(
      this.previousTransactions,
    );
    return this.previousTransactions;
  }
}

module.exports = BlockExecutionDBTransactions;
