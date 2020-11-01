const { ChainLock } = require('@dashevo/dashcore-lib');
const SimplifiedMNListStore = require('@dashevo/dashcore-lib/lib/deterministicmnlist/SimplifiedMNListStore');

const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

/**
 *
 * @param {SimplifiedMNListStore} smlStore
 * @return {verifyChainlockQueryHandler}
 */
function verifyChainlockQueryHandlerFactory(smlStore) {
  /**
   * @typedef identityQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {Buffer} data.chainLock
   * @return {Promise<ResponseQuery>}
   */
  async function verifyChainlockQueryHandler(params, { chainLock }) {

    const chainlock = new ChainLock(chainLock);

    if (!chainlock.verify(smlStore)) {
      return new ResponseQuery({
        code: 2,
        info: 'wrong chainlock signature',
        log: 'wrong chainlock signature',
      });
    }

    return new ResponseQuery();
  }

  return verifyChainlockQueryHandler;
}

module.exports = verifyChainlockQueryHandlerFactory;
