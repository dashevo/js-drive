const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');

/**
 *
 * @param {IdentityLevelDBRepository} identityRepository
 * @return {identityQueryHandler}
 */
function identityQueryHandlerFactory(identityRepository) {
  /**
   * @typedef identityQueryHandler
   * @param {Object} params
   * @param {string} params.id
   * @return {Promise<ResponseQuery>}
   */
  async function identityQueryHandler({ id }) {
    const identity = await identityRepository.fetch(id);

    if (!identity) {
      throw new InvalidArgumentAbciError('Identity with specified ID is not found');
    }

    return new ResponseQuery({
      value: identity.serialize(),
    });
  }

  return identityQueryHandler;
}

module.exports = identityQueryHandlerFactory;
