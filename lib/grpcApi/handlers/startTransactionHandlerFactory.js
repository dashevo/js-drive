const { StartTransactionResponse } = require('@dashevo/drive-grpc');

const InternalGrpcError = require('../error/InternalGrpcError');
const FailedPreconditionGrpcError = require('../error/FailedPreconditionGrpcError');
const TransactionIsAlreadyStartedError = require('../../mongoDb/errors/TransactionIsAlreadyStartedError');

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
      if (error instanceof TransactionIsAlreadyStartedError) {
        throw new FailedPreconditionGrpcError(error);
      }

      throw new InternalGrpcError(error);
    }

    return new StartTransactionResponse();
  }

  return startTransactionHandler;
};
