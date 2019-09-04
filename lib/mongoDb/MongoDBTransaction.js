const InvalidSessionError = require('./errors/InvalidSessionError');

const UNKNOWN_TRANSACTION_COMMIT_RESULT = 'UnknownTransactionCommitResult';
const TRANSIENT_TRANSACTION_ERROR = 'TransientTransactionError';

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
   *
   * @returns {Promise<void>}
   */
  async start() {
    if (this.session) {
      throw new InvalidSessionError('Session is already started');
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
      throw new InvalidSessionError('Session is not started');
    }

    try {
      await this.session.commitTransaction();
    } catch (error) {
      if (error.errorLabels && error.errorLabels.indexOf(UNKNOWN_TRANSACTION_COMMIT_RESULT) >= 0) {
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
      throw new InvalidSessionError('Session is not started');
    }

    return this.session.abortTransaction();
  }

  /**
   * Run query to mongoDB with transaction
   *
   * @param {Function} transactionFunction
   * @returns {Promise<Promise<*|undefined>|*>}
   */
  async runWithTransaction(transactionFunction) {
    if (!this.session) {
      throw new InvalidSessionError('Session is not started');
    }

    try {
      return await transactionFunction(this.mongoClient, this.session);
    } catch (error) {
      if (error.errorLabels && error.errorLabels.indexOf(TRANSIENT_TRANSACTION_ERROR) >= 0) {
        return this.runWithTransaction(transactionFunction);
      }

      throw error;
    }
  }
}

module.exports = MongoDBTransaction;
