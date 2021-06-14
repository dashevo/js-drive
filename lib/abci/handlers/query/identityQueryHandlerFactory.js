const {
  tendermint: {
    abci: {
      ResponseQuery,
    },
  },
} = require('@dashevo/abci/types');

const cbor = require('cbor');

const NotFoundAbciError = require('../../errors/NotFoundAbciError');
const UnavailableAbciError = require('../../errors/UnavailableAbciError');

/**
 *
 * @param {IdentityStoreRepository} previousIdentityRepository
 * @param {RootTree} previousRootTree
 * @param {IdentitiesStoreRootTreeLeaf} previousIdentitiesStoreRootTreeLeaf
 * @param {BlockExecutionContext} previousBlockExecutionContext
 * @param {BlockExecutionContext} blockExecutionContext
 * @return {identityQueryHandler}
 */
function identityQueryHandlerFactory(
  previousIdentityRepository,
  previousRootTree,
  previousIdentitiesStoreRootTreeLeaf,
  previousBlockExecutionContext,
  blockExecutionContext,
) {
  /**
   * @typedef identityQueryHandler
   * @param {Object} params
   * @param {Object} options
   * @param {Buffer} options.id
   * @param {Object} request
   * @param {boolean} [request.prove]
   * @return {Promise<ResponseQuery>}
   */
  async function identityQueryHandler(params, { id }, request) {
    const includeProof = request.prove === 'true';

    const identity = await previousIdentityRepository.fetch(id);

    if (!identity) {
      throw new NotFoundAbciError('Identity not found');
    }

    const identityBuffer = identity.toBuffer();

    if (!blockExecutionContext || !previousBlockExecutionContext
        || !blockExecutionContext.getLastCommitInfo()
        || !previousBlockExecutionContext.getHeader()) {
      throw new UnavailableAbciError();
    }

    const {
      quorumHash,
      signature,
    } = blockExecutionContext.getLastCommitInfo();

    const {
      height: blockHeight,
      coreChainLockedHeight,
    } = previousBlockExecutionContext.getHeader();

    const value = {
      metadata: {
        height: blockHeight,
        chainLockedCoreHeight: coreChainLockedHeight,
      },
    };

    if (includeProof) {
      value.proof = {
        signatureLlmqHash: quorumHash,
        signature,
        ...previousRootTree.getFullProof(previousIdentitiesStoreRootTreeLeaf, [id]),
      };
    } else {
      value.data = identityBuffer;
    }

    return new ResponseQuery({
      value: cbor.encode(value),
    });
  }

  return identityQueryHandler;
}

module.exports = identityQueryHandlerFactory;
