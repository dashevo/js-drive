/**
 * @param {DapContractMongoDbRepository} dapContractMongoDbRepository
 * @param {RpcClient} rpcClient
 * @param {applyStateTransition} applyStateTransition
 * @returns {revertDapContractsForBlock}
 */
function revertDapContractsForBlockFactory(
  dapContractMongoDbRepository,
  rpcClient,
  applyStateTransition,
) {
  /**
   *
   * @param blockHash
   * @param stHeaderHash
   * @returns {Promise<void>}
   */
  async function applyStateTransitionFromReference({ blockHash, stHeaderHash }) {
    const { result: block } = await rpcClient.getBlock(blockHash);
    const { result: header } = await rpcClient.getRawTransaction(stHeaderHash, 1);
    await applyStateTransition(header, block);
  }

  /**
   *
   * @param {object} staleBlock
   * @returns {Promise<void>}
   */
  async function revertDapContractsForBlock(staleBlock) {
    const dapContracts = await dapContractMongoDbRepository
      .findByReferenceBlockHash(staleBlock.hash);

    for (const dapContract of dapContracts) {
      await dapContractMongoDbRepository.deleteByReferenceBlockHash(staleBlock.hash);

      const previousVersions = dapContract.getPreviousVersions()
        .sort((prev, next) => prev.version - next.version);

      for (const { reference } of previousVersions) {
        await applyStateTransitionFromReference(reference);
      }
    }
  }

  return revertDapContractsForBlock;
}

module.exports = revertDapContractsForBlockFactory;
