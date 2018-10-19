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
   * @param {object} staleBlock
   * @returns {Promise<void>}
   */
  async function revertDapContractsForBlock(staleBlock) {
    const dapContracts = await dapContractMongoDbRepository
      .findByReferenceBlockHash(staleBlock.hash);

    for (let j = 0; j < dapContracts.length; j++) {
      const dapContract = dapContracts[j];
      await dapContractMongoDbRepository.deleteByReferenceBlockHash(staleBlock.hash);
      const previousVersions = dapContract.getPreviousVersions()
        .sort((prev, next) => prev.version - next.version);

      for (let i = 0; i < previousVersions.length; i++) {
        const previousVersionReference = previousVersions[i].reference;
        const { result: block } = await rpcClient.getBlock(previousVersionReference.blockHash);
        const transactionId = previousVersionReference.stHeaderHash;
        const { result: header } = await rpcClient.getRawTransaction(transactionId, 1);
        await applyStateTransition(header, block);
      }
    }
  }

  return revertDapContractsForBlock;
}

module.exports = revertDapContractsForBlockFactory;
