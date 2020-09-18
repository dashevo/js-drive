const cbor = require('cbor');

const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

/**
 *
 * @param {PublicKeyIdentityIdMapLevelDBRepository} publicKeyIdentityIdRepository
 * @param {IdentityLevelDBRepository} identityRepository
 * @return {identitiesByPublicKeyHashesQueryHandler}
 */
function identitiesByPublicKeyHashesQueryHandlerFactory(
  publicKeyIdentityIdRepository,
  identityRepository,
) {
  /**
   * @typedef identitiesByPublicKeyHashesQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {string} data.publicKeyHashes
   * @return {Promise<ResponseQuery>}
   */
  async function identitiesByPublicKeyHashesQueryHandler(params, { publicKeyHashes }) {
    const identities = await Promise.all(
      publicKeyHashes.map(async (publicKeyHash) => {
        const identityId = await publicKeyIdentityIdRepository.fetch(publicKeyHash);

        if (!identityId) {
          return null;
        }

        return identityRepository.fetch(identityId);
      }),
    );

    const publicKeyHashIdentitiesMap = publicKeyHashes.reduce((result, publicKeyHash, index) => {
      const identity = identities[index];
      return {
        ...result,
        [publicKeyHash]: identity,
      };
    }, {});

    return new ResponseQuery({
      value: await cbor.encodeAsync(
        publicKeyHashIdentitiesMap,
      ),
    });
  }

  return identitiesByPublicKeyHashesQueryHandler;
}

module.exports = identitiesByPublicKeyHashesQueryHandlerFactory;
