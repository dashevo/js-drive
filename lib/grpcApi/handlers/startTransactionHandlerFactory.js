const { StartTransactionResponse } = require('@dashevo/drive-grpc');

const InternalGrpcError = require('../error/InternalGrpcError');

/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @returns {startTransactionHandler}
 */
module.exports = function startTransactionHandlerFactory(stateViewTransaction) {
  /**
   * Start new transaction in database
   *
   * @typedef startTransactionHandler
   * @returns {Promise<StartTransactionResponse>}
   */
  async function startTransactionHandler() {
    try {
      stateViewTransaction.start();
    } catch (error) {
      throw new InternalGrpcError(error);
    }

    return new StartTransactionResponse();
  }

  return startTransactionHandler;
};
