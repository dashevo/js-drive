const { CommitTransactionResponse } = require('@dashevo/drive-grpc');
/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @param {SVDocumentMongoDbRepository} svDocumentRepository
 * @returns {commitTransactionHandler}
 */
module.exports = function commitTransactionHandlerFactory(stateViewTransaction, svDocumentRepository) {
  /**
   * @typedef commitTransactionHandler
   * @param {Object} call
   * @returns {Promise<void>}
   */
  async function commitTransactionHandler(call) {
    const { request } = call;

    await stateViewTransaction.commit();

    svDocumentRepository.createCollection();

    const response = new CommitTransactionResponse();

    return response;
  }

  return commitTransactionHandler;
};
