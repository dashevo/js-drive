const {
  tendermint: {
    abci: {
      ResponseInfo,
    },
  },
} = require('@dashevo/abci/types');

const { asValue } = require('awilix');

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
  chainInfoRepository,
  protocolVersion,
  rootTree,
  updateSimplifiedMasternodeList,
  logger,
  container,
) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @return {Promise<ResponseInfo>}
   */
  async function infoHandler(request) {
    let contextLogger = logger.child({
      abciMethod: 'info',
    });

    contextLogger.debug('Info ABCI method requested');

    const chainInfo = await chainInfoRepository.fetch();

    container.register({
      chainInfo: asValue(chainInfo),
    });

    contextLogger = contextLogger.child({
      height: chainInfo.getLastBlockHeight().toString(),
    });

    // Update SML store to latest saved core chain lock to make sure
    // that verfy chain lock handler has updated SML Store to verify signatures
    if (chainInfo.getLastBlockHeight().gt(0)) {
      const lastCoreChainLockedHeight = chainInfo.getLastCoreChainLockedHeight();

      await updateSimplifiedMasternodeList(lastCoreChainLockedHeight);
    }

    contextLogger.info(
      {
        drive: {
          ...chainInfo.toJSON(),
          version: driveVersion,
          appVersion: protocolVersion.toString(),
          lastBlockAppHash: rootTree.getRootHash(),
        },
        tenderdash: {
          version: request.version,
          blockVersion: request.blockVersion.toString(),
          p2pVersion: request.p2pVersion.toString(),
          abciVersion: request.abciVersion,
        },
      },
      `Tenderdash v${request.version} is connected`,
    );

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
