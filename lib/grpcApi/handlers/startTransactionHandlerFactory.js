const { StartTransactionResponse } = require('@dashevo/drive-grpc');
/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @returns {startTransactionHandler}
 */
module.exports = function startTransactionHandlerFactory(stateViewTransaction) {
  /**
   * @typedef startTransactionHandler
   * @param {Object} call
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async function startTransactionHandler(call) {
    // const { request } = call;

    stateViewTransaction.start();

    const response = new StartTransactionResponse();

    return response;
  }

  return startTransactionHandler;
};
