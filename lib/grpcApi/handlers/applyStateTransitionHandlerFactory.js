const { ApplyStateTransitionResponse } = require('@dashevo/drive-grpc');

/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @returns {applyStateTransitionHandler}
 */
module.exports = function applyStateTransitionHandlerFactory(stateViewTransaction) {
  /**
   * @typedef applyStateTransitionHandler
   * @param {Object} call
   * @returns {Promise<void>}
   */
  async function applyStateTransitionHandler(call) {
    const { request } = call;

    // SVDocumentMongoDbRepository ???

    await stateViewTransaction.runWithTransaction(async (mongoClient, session) => {

    });


    const response = new ApplyStateTransitionResponse();

    return response;
  }

  return applyStateTransitionHandler;
};
