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

    const {
      appHash,
    } = blockExecutionContext.getHeader();

    const {
      quorumHash,
      signature,
    } = blockExecutionContext.getLastCommitInfo();

    if (!previousBlockExecutionContext) {
      throw new UnavailableAbciError();
    }

    const {
      height: blockHeight,
      coreChainLockedHeight,
    } = previousBlockExecutionContext.getHeader();

    const value = {
      metadata: {
        height: blockHeight,
        chain_locked_core_height: coreChainLockedHeight,
      },
    };

    if (!!appHash || !!blockHeight || !!coreChainLockedHeight
        || !!quorumHash || !!signature) {
      throw new UnavailableAbciError();
    }

    if (includeProof) {
      value.proof = {
        app_hash: appHash,
        quorum_hash: quorumHash,
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
