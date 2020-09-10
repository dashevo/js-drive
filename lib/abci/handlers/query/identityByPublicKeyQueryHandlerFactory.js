const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const NotFoundAbciError = require('../../errors/NotFoundAbciError');

/**
 *
 * @param {PublicKeyIdentityIdMapLevelDBRepository} publicKeyIdentityIdRepository
 * @param {IdentityLevelDBRepository} identityRepository
 * @return {identityByPublicKeyQueryHandler}
 */
function identityByPublicKeyQueryHandlerFactory(
  publicKeyIdentityIdRepository,
  identityRepository,
) {
  /**
   * @typedef identityByPublicKeyQueryHandler
   * @param {Object} params
   * @param {string} params.publicKeyHash
   * @return {Promise<ResponseQuery>}
   */
  async function identityByPublicKeyQueryHandler({ publicKeyHash }) {
    const identityId = await publicKeyIdentityIdRepository.fetch(publicKeyHash);

    if (!identityId) {
      throw new NotFoundAbciError('Identity not found');
    }

    const identity = await identityRepository.fetch(identityId);

    if (!identity) {
      throw new NotFoundAbciError('Identity not found');
    }

    return new ResponseQuery({
      value: identity.serialize(),
    });
  }

  return identityByPublicKeyQueryHandler;
}

module.exports = identityByPublicKeyQueryHandlerFactory;
