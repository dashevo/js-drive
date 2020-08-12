const {
  abci: {
    ResponseInfo,
  },
} = require('abci/types');

const { version: driveVersion } = require('../../../package');

/**
 * @param {BlockchainState} blockchainState
 * @return {infoHandler}
 */
function infoHandlerFactory(blockchainState) {
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
      appVersion: blockchainState.getAppVersion(),
      lastBlockHeight: blockchainState.getLastBlockHeight(),
      lastBlockAppHash: blockchainState.getLastBlockAppHash(),
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
