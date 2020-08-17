const {
  abci: {
    ResponseInfo,
  },
} = require('abci/types');

const { version: driveVersion } = require('../../../package');

/**
 * @param {BlockchainState} blockchainState
 * @param {Number} appVersion
 * @return {infoHandler}
 */
function infoHandlerFactory(blockchainState, appVersion) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @return {Promise<ResponseInfo>}
   */
  async function infoHandler() {
    return new ResponseInfo({
      version: driveVersion,
      appVersion,
      lastBlockHeight: blockchainState.getLastBlockHeight(),
      lastBlockAppHash: blockchainState.getLastBlockAppHash(),
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
