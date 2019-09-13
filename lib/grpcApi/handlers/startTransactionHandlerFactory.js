const { StartTransactionResponse } = require('@dashevo/drive-grpc');
/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @returns {startTransactionHandler}
 */
module.exports = function startTransactionHandlerFactory(stateViewTransaction) {
  /**
   * Start new transaction in database
   *
   * @typedef startTransactionHandler
   * @param {Object} call
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async function startTransactionHandler(call) {
    stateViewTransaction.start();

    return new StartTransactionResponse();
  }

  return startTransactionHandler;
};
