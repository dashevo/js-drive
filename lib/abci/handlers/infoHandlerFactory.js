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
 * @param {ChainInfo} chainInfoRepository
 * @param {Number} protocolVersion
 * @param {RootTree} rootTree
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {getMasternodeInfo} getMasternodeInfo
 * @param {BaseLogger} logger
 * @param {container} container
 * @return {infoHandler}
 */
function infoHandlerFactory(
  chainInfoRepository,
  protocolVersion,
  rootTree,
  updateSimplifiedMasternodeList,
  getMasternodeInfo,
  logger,
  container,
) {
  /**
   * Info ABCI handler
   *
   * @typedef infoHandler
   *
   * @return {Promise<ResponseInfo>}
   */
  async function infoHandler() {
    logger.debug('Tenderdash requests Info');

    const mnStatus = await getMasternodeInfo();

    if (!mnStatus.proTxHash) {
      logger.debug('infoHandler: masternode status returned no proTxHash');
      throw new Error('infoHandler: masternode status returned no proTxHash');
    }

    const chainInfo = await chainInfoRepository.fetch();

    container.register({
      chainInfo: asValue(chainInfo),
    });

    logger.debug(`Last block height from stored chain info: ${chainInfo.getLastBlockHeight()}`);

    // Update SML store to latest saved core chain lock to make sure
    // that verfy chain lock handler has updated SML Store to verify signatures
    if (chainInfo.getLastBlockHeight().gt(0)) {
      const lastCoreChainLockedHeight = chainInfo.getLastCoreChainLockedHeight();

      logger.debug(`Updaing SML from saved last core chain locked height ${lastCoreChainLockedHeight}`);

      await updateSimplifiedMasternodeList(lastCoreChainLockedHeight);
    }

    return new ResponseInfo({
      version: driveVersion,
      appVersion: protocolVersion,
      lastBlockHeight: chainInfo.getLastBlockHeight(),
      lastBlockAppHash: rootTree.getRootHash(),
      //proTxHash: mnStatus.proTxHash, TODO: active when tendermint.abci.ResponseInfo is ready
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
