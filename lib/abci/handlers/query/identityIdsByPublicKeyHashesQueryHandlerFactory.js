const cbor = require('cbor');

const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

/**
 *
 * @param {PublicKeyIdentityIdMapLevelDBRepository} publicKeyIdentityIdRepository
 * @return {identityIdsByPublicKeyHashesQueryHandler}
 */
function identityIdsByPublicKeyHashesQueryHandlerFactory(publicKeyIdentityIdRepository) {
  /**
   * @typedef identityIdsByPublicKeyHashesQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {string} data.publicKeyHashes
   * @return {Promise<ResponseQuery>}
   */
  async function identityIdsByPublicKeyHashesQueryHandler(params, { publicKeyHashes }) {
    const publicKeyHashIdentityIdPairs = await Promise.all(
      publicKeyHashes.map(async (publicKeyHash) => {
        const identityId = await publicKeyIdentityIdRepository.fetch(publicKeyHash);
        return {
          [publicKeyHash]: identityId,
        };
      }),
    );

    const publicKeyHashIdentityIdMap = publicKeyHashIdentityIdPairs.reduce((result, nextPair) => ({
      ...result,
      ...nextPair,
    }), {});

    return new ResponseQuery({
      value: cbor.encodeCanonical({
        publicKeyHashIdentityIdMap,
      }),
    });
  }

  return identityIdsByPublicKeyHashesQueryHandler;
}

module.exports = identityIdsByPublicKeyHashesQueryHandlerFactory;
