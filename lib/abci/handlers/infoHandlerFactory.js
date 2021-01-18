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
 * @param {ChainInfoExternalStoreRepository} chainInfoRepository
 * @param {CreditsDistributionPool} creditsDistributionPool
 * @param {CreditsDistributionPoolCommonStoreRepository} creditsDistributionPoolRepository
 * @param {Number} protocolVersion
 * @param {RootTree} rootTree
 * @param {updateSimplifiedMasternodeList} updateSimplifiedMasternodeList
 * @param {BaseLogger} logger
 * @return {infoHandler}
 */
function infoHandlerFactory(
  chainInfo,
  chainInfoRepository,
  creditsDistributionPool,
  creditsDistributionPoolRepository,
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
    logger.debug('Tenderdash requests Info');

    const fetchedChainInfo = await chainInfoRepository.fetch();

    chainInfo.populate(fetchedChainInfo.toJSON());

    const fetchedCreditsDistributionPool = await creditsDistributionPoolRepository.fetch();

    creditsDistributionPool.populate(fetchedCreditsDistributionPool.toJSON());

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
    });
  }

  return infoHandler;
}

module.exports = infoHandlerFactory;
