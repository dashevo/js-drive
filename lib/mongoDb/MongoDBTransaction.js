const SessionIsNotStartedError = require('./errors/SessionIsNotStartedError');
const SessionIsAlreadyStartedError = require('./errors/SessionIsAlreadyStartedError');

class MongoDBTransaction {
  /**
   *
   * @param {MongoClient} mongoClient
   */
  constructor(mongoClient) {
    this.mongoClient = mongoClient;
    this.session = null;
  }

  /**
   * Start new transaction
   */
  start() {
    if (this.session) {
      throw new SessionIsAlreadyStartedError();
    }

    this.session = this.mongoClient.startSession();
    this.session.startTransaction();
  }

  /**
   * Commit transaction
   *
   * @returns {Promise<void>}
   */
  async commit() {
    if (!this.session) {
      throw new SessionIsNotStartedError();
    }

    const { ERRORS } = MongoDBTransaction;

    try {
      await this.session.commitTransaction();
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
   * @returns {Promise<*>}
   */
  async abort() {
    if (!this.session) {
      throw new SessionIsNotStartedError();
    }

    return this.session.abortTransaction();
  }

  /**
   * Run query to mongoDB with transaction
   *
   * @param {Function} transactionFunction
   * @returns {Promise<*>}
   */
  async runWithTransaction(transactionFunction) {
    if (!this.session) {
      throw new SessionIsNotStartedError();
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
