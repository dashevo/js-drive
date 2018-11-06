const GetPacketTimeoutError = require('../../storage/errors/GetPacketTimeoutError');

const rejectAfter = require('../../util/rejectAfter');

/**
 *
 * @param {IpfsAPI} ipfsAPI
 * @param {RpcClient} rpcClient
 * @param {createDapObjectMongoDbRepository} createDapObjectMongoDbRepository
 * @param {applyStateTransition} applyStateTransition
 * @param {number} ipfsGetTimeout
 * @returns {revertDapObjectsForStateTransition}
 */
module.exports = function revertDapObjectsForStateTransitionFactory(
  ipfsAPI,
  rpcClient,
  createDapObjectMongoDbRepository,
  applyStateTransition,
  ipfsGetTimeout,
) {
  /**
   * @param {string} blockHash
   * @param {string} stHeaderHash
   * @returns {Promise<void>}
   */
  async function applyStateTransitionFromReference({ blockHash, stHeaderHash }) {
    const [{ result: block }, { result: header }] = await Promise.all([
      rpcClient.getBlock(blockHash),
      rpcClient.getRawTransaction(stHeaderHash),
    ]);
    await applyStateTransition(header, block);
  }

  /**
   * @typedef revertDapObjectsForStateTransition
   * @param {StateTransitionHeader} stateTransition
   * @returns {Promise<void>}
   */
  async function revertDapObjectsForStateTransition({ stateTransition }) {
    const getPacketDataPromise = ipfsAPI.dag.get(stateTransition.getPacketCID());
    const error = new GetPacketTimeoutError();
    const { value: packetData } = await rejectAfter(getPacketDataPromise, error, ipfsGetTimeout);

    const dapObjectMongoDbRepository = await createDapObjectMongoDbRepository(packetData.dapid);

    const dapObjects = await dapObjectMongoDbRepository
      .findAllBySTHeaderHash(stateTransition.hash);

    for (const dapObject of dapObjects) {
      dapObject.markAsDeleted();
      await dapObjectMongoDbRepository.store(dapObject);

      const previousRevisions = dapObject.getPreviousRevisions()
        .sort((prev, next) => prev.revision - next.revision);

      for (const { reference } of previousRevisions) {
        await applyStateTransitionFromReference(reference);
      }
    }
  }

  return revertDapObjectsForStateTransition;
};
