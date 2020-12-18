const {
  tendermint: {
    abci: {
      ResponseInfo,
    },
  },
} = require('@dashevo/abci/types');

const { version: driveVersion } = require('../../../package');

/**
 * @param {ChainInfo} chainInfo
 * @param {Number} protocolVersion
 * @param {RootTree} rootTree
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {BaseLogger} logger
 * @return {infoHandler}
 */
function infoHandlerFactory(
  chainInfo,
  protocolVersion,
  rootTree,
  updateSimplifiedMasternodeList,
  logger,
) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @return {Promise<ResponseInfo>}
   */
  async function infoHandler() {
    if (chainInfo.getLastBlockHeight().gt(0)) {
      logger.debug('Updaing SML from saved last core chain locked height');

      await updateSimplifiedMasternodeList(
        chainInfo.getLastCoreChainLockedHeight(),
      );
    }

    return new ResponseInfo({
      version: driveVersion,
      appVersion: protocolVersion,
      lastBlockHeight: chainInfo.getLastBlockHeight(),
      lastBlockAppHash: rootTree.getRootHash(),
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
