class BlockExecutionStoreTransactionIsNotDefinedError extends Error {
  /**
   * Indicates, if Transaction is not defined in BlockExecutionStoreTransactions
   * @param {string} name
   */
  constructor(name) {
    super();

    this.name = this.constructor.name;
    this.message = `Transaction ${name} not defined`;
    this.transactionName = name;

    Error.captureStackTrace(this, this.constructor);
  }

  getName() {
    return this.transactionName;
  }
}

module.exports = BlockExecutionStoreTransactionIsNotDefinedError;
