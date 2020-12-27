/**
 * Gets masternode info (factory)
 *
 * @param {RpcClient} coreRpcClient
 * @param {BaseLogger} logger
 * @returns {getMasternodeInfo}
 */
function getMasternodeInfoFactory(coreRpcClient, logger) {
  /**
   * Gets masternode info
   * by calling DashCore's quorum info rpc cmd
   *
   * @typedef getMasternodeInfo
   *
   * @returns {Promise<Object>}
   */
  async function getMasternodeInfo() {
    try {
      return await coreRpcClient.masternode('status');
    } catch (e) {
      // This is not a masternode
      if (e.code === -32603) {
        logger.error(`getMasternodeInfo: ${e.message}`);
      } else {
        logger.error(`getMasternodeInfo: Unknown masternode status error ${e}`);
      }
      throw e;
    }
  }

  return getMasternodeInfo;
}

module.exports = getMasternodeInfoFactory;
