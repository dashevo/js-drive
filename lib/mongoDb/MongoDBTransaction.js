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
   *
   * @returns {Promise<void>}
   */
  async start() {
    if (this.session) {
      throw new Error('Session is already started');
    }

    this.session = this.mongoClient.startSession();
    this.session.startTransaction();
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async commit() {
    if (!this.session) {
      throw new Error('Session is not started');
    }

    try {
      await this.session.commitTransaction();
    } catch (error) {
      if (error.errorLabels && error.errorLabels.indexOf('UnknownTransactionCommitResult') >= 0) {
        await this.commit();
      } else {
        throw error;
      }
    }
  }

  /**
   *
   * @returns {Promise<*>}
   */
  async abort() {
    if (!this.session) {
      throw new Error('Session is not started');
    }

    return this.session.abortTransaction();
  }

  /**
   *
   * @returns {ClientSession|null}
   */
  getSession() {
    return this.session;
  }

  /**
   *
   * @param {function} txFunc
   * @returns {Promise<Promise<*|undefined>|*>}
   */
  async runWithTransaction(txFunc) {
    if (!this.session) {
      throw new Error('Session is not started');
    }

    try {
      return await txFunc();
    } catch (error) {
      if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') >= 0) {
        return this.runWithTransaction(txFunc);
      }

      throw error;
    }
  }
}

module.exports = MongoDBTransaction;
