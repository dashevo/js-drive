const TransactionIsNotStartedError = require('./errors/TransactionIsNotStartedError');
const TransactionIsAlreadyStartedError = require('./errors/TransactionIsAlreadyStartedError');

class MongoDBTransaction {
  /**
   *
   * @param {MongoClient} mongoClient
   */
  constructor(mongoClient) {
    this.mongoClient = mongoClient;
    this.session = null;
    this.transactionIsStarted = false;
  }

  /**
   * Start new transaction
   */
  start() {
    if (this.transactionIsStarted) {
      throw new TransactionIsAlreadyStartedError();
    }

    if (!this.session || this.session.hasEnded) {
      this.session = this.mongoClient.startSession();
    }

    this.session.startTransaction();
    this.transactionIsStarted = true;
  }

  /**
   * Commit transaction
   *
   * @returns {Promise<void>}
   */
  async commit() {
    if (!this.transactionIsStarted) {
      throw new TransactionIsNotStartedError();
    }

    const { ERRORS } = MongoDBTransaction;

    try {
      await this.session.commitTransaction();

      this.transactionIsStarted = false;
    } catch (error) {
      if (error.errorLabels
        && error.errorLabels.indexOf(ERRORS.UNKNOWN_TRANSACTION_COMMIT_RESULT) >= 0) {
        await this.commit();
      } else {
        throw error;
      }
    }
  }

  /**
   * Abort current transaction
   *
   * @returns {Promise<void>}
   */
  async abort() {
    if (!this.transactionIsStarted) {
      throw new TransactionIsNotStartedError();
    }

    await this.session.abortTransaction();
    this.transactionIsStarted = false;
  }

  /**
   * Run query to mongoDB with transaction
   *
   * @param {Function} transactionFunction
   * @returns {Promise<*>}
   */
  async runWithTransaction(transactionFunction) {
    if (!this.transactionIsStarted) {
      throw new TransactionIsNotStartedError();
    }

    const { ERRORS } = MongoDBTransaction;

    try {
      return await transactionFunction(this.mongoClient, this.session);
    } catch (error) {
      if (error.errorLabels
        && error.errorLabels.indexOf(ERRORS.TRANSIENT_TRANSACTION_ERROR) >= 0) {
        return this.runWithTransaction(transactionFunction);
      }

      throw error;
    }
  }
}

MongoDBTransaction.ERRORS = {
  UNKNOWN_TRANSACTION_COMMIT_RESULT: 'UnknownTransactionCommitResult',
  TRANSIENT_TRANSACTION_ERROR: 'TransientTransactionError',
};

module.exports = MongoDBTransaction;
