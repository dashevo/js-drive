const {
  tendermint: {
    abci: {
      ResponseQuery,
    },
  },
} = require('@dashevo/abci/types');

/**
 *
 * @param {RootTree} previousRootTree
 * @param {DocumentsStoreRootTreeLeaf} previousDocumentsStoreRootTreeLeaf
 * @param {IdentitiesStoreRootTreeLeaf} previousIdentitiesStoreRootTreeLeaf
 * @param {DataContractsStoreRootTreeLeaf} previousDataContractsStoreRootTreeLeaf
 * @return {getProofsQueryHandler}
 */
function getProofsQueryHandlerFactory(
  previousRootTree,
  previousDocumentsStoreRootTreeLeaf,
  previousIdentitiesStoreRootTreeLeaf,
  previousDataContractsStoreRootTreeLeaf,
) {
  /**
   * @typedef getProofsQueryHandler
   * @param {Identifier[]} identityIds
   * @param {Identifier[]} documentIds
   * @param {Identifier[]} dataContractIds
   * @return {Promise<ResponseQuery>}
   */
  async function getProofsQueryHandler(
    { identityIds, documentIds, dataContractIds },
  ) {
    let documentsProof = null;
    let identitiesProof = null;
    let dataContractsProof = null;

    if (documentIds && documentIds.length) {
      documentsProof = previousRootTree
        .getFullProof(previousDocumentsStoreRootTreeLeaf, documentIds);
    }

    if (documentIds && documentIds.length) {
      identitiesProof = previousRootTree
        .getFullProof(previousIdentitiesStoreRootTreeLeaf, identityIds);
    }

    if (documentIds && documentIds.length) {
      dataContractsProof = previousRootTree
        .getFullProof(previousDataContractsStoreRootTreeLeaf, dataContractIds);
    }

    return new ResponseQuery({
      documentsProof, identitiesProof, dataContractsProof,
    });
  }

  return getProofsQueryHandler;
}

module.exports = getProofsQueryHandlerFactory;
