/**
 * @param {DapContractMongoDbRepository} dapContractMongoDbRepository
 * @param {RpcClient} rpcClient
 * @param {applyStateTransition} applyStateTransition
 * @returns {revertDapContractsForStateTransition}
 */
function revertDapContractsForStateTransitionFactory(
  dapContractMongoDbRepository,
  rpcClient,
  applyStateTransition,
) {
  /**
   * @param {string} blockHash
   * @param {string} stHeaderHash
   * @returns {Promise<void>}
   */
  async function applyStateTransitionFromReference({ blockHash, stHeaderHash }) {
    const [{ result: block }, { result: header }] = await Promise.all([
      rpcClient.getBlock(blockHash),
      rpcClient.getRawTransaction(stHeaderHash, 1),
    ]);
    await applyStateTransition(header, block);
  }

  /**
   * @typedef revertDapContractsForStateTransition
   * @param {{ stateTransition: StateTransitionHeader, block: object }}
   * @returns {Promise<void>}
   */
  async function revertDapContractsForStateTransition({ stateTransition }) {
    const dapContracts = await dapContractMongoDbRepository
      .findAllByReferenceSTHeaderHash(stateTransition.hash);

    for (const dapContract of dapContracts) {
      dapContract.markAsDeleted();
      await dapContractMongoDbRepository.store(dapContract);

      const previousVersions = dapContract.getPreviousVersions()
        .sort((prev, next) => prev.version - next.version);

      for (const { reference } of previousVersions) {
        await applyStateTransitionFromReference(reference);
      }
    }
  }

  return revertDapContractsForStateTransition;
}

module.exports = revertDapContractsForStateTransitionFactory;
