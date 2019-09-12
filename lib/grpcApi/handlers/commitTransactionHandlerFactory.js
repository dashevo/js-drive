const { CommitTransactionResponse } = require('@dashevo/drive-grpc');

const InvalidArgumentGrpcError = require('../error/InvalidArgumentGrpcError');

/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @param {SVContractMongoDbRepository} svContractMongoDbRepository
 * @param {createContractDatabase} createContractDatabase
 * @returns {commitTransactionHandler}
 */
module.exports = function commitTransactionHandlerFactory(
  stateViewTransaction,
  svContractMongoDbRepository,
  createContractDatabase,
) {
  /**
   * @typedef commitTransactionHandler
   * @param {Object} call
   * @returns {Promise<void>}
   */
  async function commitTransactionHandler(call) {
    const { request } = call;

    const blockHash = request.getBlockHash();

    if (!blockHash) {
      throw new InvalidArgumentGrpcError('blockHash is not specified');
    }

    //  where.reference.blockHash ===  blockHash; findAll

    const contracts = await svContractMongoDbRepository
      .findAllByReferenceSTHash(blockHash, stateViewTransaction);

    await stateViewTransaction.commit();

    for (const contract of contracts) {
      await createContractDatabase(contract);
    }

    return new CommitTransactionResponse();
  }

  return commitTransactionHandler;
};
