class NoPreviousBlockExecutionStoreTransactionsFoundError extends Error {
  constructor() {
    const message = 'No previous block execution store transactions found';
    super(message);
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = NoPreviousBlockExecutionStoreTransactionsFoundError;
