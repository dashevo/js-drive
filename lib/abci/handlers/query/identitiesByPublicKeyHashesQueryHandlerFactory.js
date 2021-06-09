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
 * @param {IdentityStoreRepository} previousIdentityRepository
 * @param {number} maxIdentitiesPerRequest
 * @param {RootTree} previousRootTree
 * @param {IdentitiesStoreRootTreeLeaf} previousIdentitiesStoreRootTreeLeaf
 * @param {BlockExecutionContext} previousBlockExecutionContext
 * @param {BlockExecutionContext} blockExecutionContext
 * @return {identitiesByPublicKeyHashesQueryHandler}
 */
function identitiesByPublicKeyHashesQueryHandlerFactory(
  previousPublicKeyToIdentityIdRepository,
  previousIdentityRepository,
  maxIdentitiesPerRequest,
  previousRootTree,
  previousIdentitiesStoreRootTreeLeaf,
  previousBlockExecutionContext,
  blockExecutionContext,
) {
  /**
   * @typedef identitiesByPublicKeyHashesQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {Buffer[]} data.publicKeyHashes
   * @param {Object} request
   * @param {boolean} [request.prove]
   * @return {Promise<ResponseQuery>}
   */
  async function identitiesByPublicKeyHashesQueryHandler(params, { publicKeyHashes }, request) {
    if (publicKeyHashes && publicKeyHashes.length > maxIdentitiesPerRequest) {
      throw new InvalidArgumentAbciError(
        `Maximum number of ${maxIdentitiesPerRequest} requested items exceeded.`, {
          maxIdentitiesPerRequest,
        },
      );
    }

    const identityIds = [];

    const identities = await Promise.all(
      publicKeyHashes.map(async (publicKeyHash) => {
        const identityId = await previousPublicKeyToIdentityIdRepository.fetch(publicKeyHash);

        if (!identityId) {
          return Buffer.alloc(0);
        }

        identityIds.push(identityId);

        const identity = await previousIdentityRepository.fetch(identityId);

        return identity.toBuffer();
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

    const includeProof = request.prove === 'true';

    if (includeProof) {
      value.proof = {
        app_hash: appHash,
        quorum_hash: quorumHash,
        signature,
        ...previousRootTree.getFullProof(previousIdentitiesStoreRootTreeLeaf, identityIds),
      };
    } else {
      value.data = identities;
    }

    return new ResponseQuery({
      value: await cbor.encodeAsync(value),
    });
  }

  return identitiesByPublicKeyHashesQueryHandler;
}

module.exports = identitiesByPublicKeyHashesQueryHandlerFactory;
