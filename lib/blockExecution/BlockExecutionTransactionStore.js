const cbor = require('cbor');

class BlockExecutionTransactionStore {
  /**
   * @param {FileDb} blockExecutionTransactionDB
   */
  constructor(blockExecutionTransactionDB) {
    this.blockExecutionTransactionDB = blockExecutionTransactionDB;
  }

  /**
   * @param {Object} transactions
   * @param {MerkDbTransaction} transactions.identity
   * @param {DocumentsDbTransaction} transactions.document
   * @param {MerkDbTransaction} transactions.dataContract
   * @param {MerkDbTransaction} transactions.publicKeyToIdentityId
   *
   * @return {void}
   */
  async store(transactions) {
    const serializedTransactions = cbor.encode({
      identity: transactions.identity.toPlainObject(),
      document: transactions.document.toPlainObject(),
      dataContract: transactions.dataContract.toPlainObject(),
      publicKeyToIdentityId: transactions.publicKeyToIdentityId
        .toPlainObject(),
    });

    await this.blockExecutionTransactionDB.set(serializedTransactions);
  }

  /**
   * Fetch latest state from DB
   * and update clean transactions with it
   *
   * @param {Object} transactions
   * @param {MerkDbTransaction} transactions.identity
   * @param {DocumentsDbTransaction} transactions.document
   * @param {MerkDbTransaction} transactions.dataContract
   * @param {MerkDbTransaction} transactions.publicKeyToIdentityId
   *
   * @return {void}
   */
  async fetchAndUpdate(transactions) {
    const serializedTransactions = await this.blockExecutionTransactionDB.get();

    if (!serializedTransactions) {
      return;
    }

    const plainObjectTransactions = cbor.decode(serializedTransactions);

    transactions.identity.updateFromPlainObject(
      plainObjectTransactions.identity,
    );
    transactions.document.updateFromPlainObject(
      plainObjectTransactions.document,
    );
    transactions.dataContract.updateFromPlainObject(
      plainObjectTransactions.dataContract,
    );
    transactions.publicKeyToIdentityId.updateFromPlainObject(
      plainObjectTransactions.publicKeyToIdentityId,
    );
  }

  /**
   * Clear DB state
   *
   * @return {void}
   */
  async clear() {
    await this.blockExecutionTransactionDB.clear();
  }
}

module.exports = BlockExecutionTransactionStore;
