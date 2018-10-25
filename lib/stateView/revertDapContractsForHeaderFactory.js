/**
 * @param {DapContractMongoDbRepository} dapContractMongoDbRepository
 * @param {RpcClient} rpcClient
 * @param {applyStateTransition} applyStateTransition
 * @returns {revertDapContractsForHeader}
 */
function revertDapContractsForHeaderFactory(
  dapContractMongoDbRepository,
  rpcClient,
  applyStateTransition,
) {
  /**
   *
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
   *
   * @param {object} staleHeader
   * @returns {Promise<void>}
   */
  async function revertDapContractsForHeader(staleHeader) {
    const dapContracts = await dapContractMongoDbRepository
      .findAllByReferenceSTHeaderHash(staleHeader.hash);

    for (const dapContract of dapContracts) {
      dapContract.markDeleted();
      await dapContractMongoDbRepository.store(dapContract);

      const previousVersions = dapContract.getPreviousVersions()
        .sort((prev, next) => prev.version - next.version);

      for (const { reference } of previousVersions) {
        await applyStateTransitionFromReference(reference);
      }
    }
  }

  return revertDapContractsForHeader;
}

module.exports = revertDapContractsForHeaderFactory;
