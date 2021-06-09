const cbor = require('cbor');

const {
  tendermint: {
    abci: {
      ResponseQuery,
    },
  },
} = require('@dashevo/abci/types');

const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');
const UnavailableAbciError = require('../../errors/UnavailableAbciError');

/**
 *
 * @param {PublicKeyToIdentityIdStoreRepository} previousPublicKeyToIdentityIdRepository
 * @param {number} maxIdentitiesPerRequest
 * @param {RootTree} previousRootTree
 * @param {PublicKeyToIdentityIdStoreRootTreeLeaf} previousPublicKeyToIdentityIdStoreRootTreeLeaf
 * @param {BlockExecutionContext} previousBlockExecutionContext
 * @param {BlockExecutionContext} blockExecutionContext
 * @return {identityIdsByPublicKeyHashesQueryHandler}
 */
function identityIdsByPublicKeyHashesQueryHandlerFactory(
  previousPublicKeyToIdentityIdRepository,
  maxIdentitiesPerRequest,
  previousRootTree,
  previousPublicKeyToIdentityIdStoreRootTreeLeaf,
  previousBlockExecutionContext,
  blockExecutionContext,
) {
  /**
   * @typedef identityIdsByPublicKeyHashesQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {Buffer[]} data.publicKeyHashes
   * @param {Object} request
   * @param {boolean} [request.prove]
   * @return {Promise<ResponseQuery>}
   */
  async function identityIdsByPublicKeyHashesQueryHandler(params, { publicKeyHashes }, request) {
    if (publicKeyHashes && publicKeyHashes.length > maxIdentitiesPerRequest) {
      throw new InvalidArgumentAbciError(
        `Maximum number of ${maxIdentitiesPerRequest} requested items exceeded.`, {
          maxIdentitiesPerRequest,
        },
      );
    }

    const includeProof = request.prove === 'true';

    const identityIds = await Promise.all(
      publicKeyHashes.map(async (publicKeyHash) => {
        const identityId = await previousPublicKeyToIdentityIdRepository.fetch(publicKeyHash);

        if (!identityId) {
          return Buffer.alloc(0);
        }

        return identityId;
      }),
    );

    const {
      appHash,
    } = blockExecutionContext.getHeader();

    const {
      height: blockHeight,
      coreChainLockedHeight,
    } = previousBlockExecutionContext.getHeader();

    const {
      quorumHash,
      signature,
    } = previousBlockExecutionContext.getLastCommitInfo();

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
        ...previousRootTree.getFullProof(
          previousPublicKeyToIdentityIdStoreRootTreeLeaf,
          publicKeyHashes,
        ),
      };
    } else {
      value.data = identityIds;
    }

    return new ResponseQuery({
      value: await cbor.encodeAsync(value),
    });
  }

  return identityIdsByPublicKeyHashesQueryHandler;
}

module.exports = identityIdsByPublicKeyHashesQueryHandlerFactory;
