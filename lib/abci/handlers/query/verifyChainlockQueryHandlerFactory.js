const { ChainLock } = require('@dashevo/dashcore-lib');

const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');

/**
 *
 * @param {SimplifiedMasternodeList} simplifiedMasternodeList
 * @return {verifyChainlockQueryHandler}
 */
function verifyChainlockQueryHandlerFactory(simplifiedMasternodeList) {
  /**
   * @typedef identityQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {Buffer} data.chainLock
   * @return {Promise<ResponseQuery>}
   */
  async function verifyChainlockQueryHandler(params, { chainLock }) {

    const chainlock = new ChainLock(chainLock);

    if (!chainlock.verify(simplifiedMasternodeList.getStore())) {
      throw new InvalidArgumentAbciError(
        `Signature invalid for chainlock
         ${chainlock}`
      );
    }

    return new ResponseQuery();
  }

  return verifyChainlockQueryHandler;
}

module.exports = verifyChainlockQueryHandlerFactory;
