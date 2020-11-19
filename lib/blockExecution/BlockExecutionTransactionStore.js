const cbor = require('cbor');

const DB_KEY = Buffer.from('transactions');

class BlockExecutionTransactionStore {
  /**
   * @param {Merk} blockExecutionTransactionDB
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
  store(transactions) {
    const serializedTransactions = cbor.encode({
      identity: transactions.identity.toPlainObject(),
      document: transactions.document.toPlainObject(),
      dataContract: transactions.dataContract.toPlainObject(),
      publicKeyToIdentityId: transactions.publicKeyToIdentityId
        .toPlainObject(),
    });

    this.blockExecutionTransactionDB.batch()
      .put(DB_KEY, serializedTransactions)
      .commitSync();
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
  fetchAndUpdate(transactions) {
    const serializedTransactions = this.blockExecutionTransactionDB.getSync();

    if (!serializedTransactions) {
      return;
    }

    const plainObjectTransactions = cbor.decode(serializedTransactions);

    transactions.identity.updateFromPlainObject(
      plainObjectTransactions.identity,
    );
    transactions.document.updateFromPlainObject(
      plainObjectTransactions.documentsDbTransaction,
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
  clear() {
    this.blockExecutionTransactionDB.batch()
      .put(DB_KEY, Buffer.alloc(0))
      .commitSync();
  }
}

module.exports = BlockExecutionTransactionStore;
