const { CommitTransactionResponse } = require('@dashevo/drive-grpc');

const InvalidArgumentGrpcError = require('../error/InvalidArgumentGrpcError');
const InternalGrpcError = require('../error/InternalGrpcError');

/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @param {SVContractMongoDbRepository} svContractMongoDbRepository
 * @param {createContractDatabase} createContractDatabase
 * @param {removeContractDatabase} removeContractDatabase
 * @returns {commitTransactionHandler}
 */
module.exports = function commitTransactionHandlerFactory(
  stateViewTransaction,
  svContractMongoDbRepository,
  createContractDatabase,
  removeContractDatabase,
) {
  /**
   * Commit transaction, that was created before and create collections for
   * documents inside of received contracts
   *
   * @typedef commitTransactionHandler
   * @param {Object} call
   * @returns {Promise<CommitTransactionResponse>}
   */
  async function commitTransactionHandler(call) {
    const { request } = call;

    const blockHash = request.getBlockHash();

    if (!blockHash) {
      throw new InvalidArgumentGrpcError('blockHash is not specified');
    }

    const contracts = await svContractMongoDbRepository
      .findAllByReferenceSTHash(blockHash, stateViewTransaction);

    const createdContracts = [];

    try {
      for (const contract of contracts) {
        await createContractDatabase(contract);
        createdContracts.push(contract);
      }

      await stateViewTransaction.commit();
    } catch (error) {
      if (stateViewTransaction.isTransactionStarted) {
        await stateViewTransaction.abort();
      }

      for (const contract of createdContracts) {
        await removeContractDatabase(contract);
      }

      throw new InternalGrpcError(error);
    }

    return new CommitTransactionResponse();
  }

  return commitTransactionHandler;
};
