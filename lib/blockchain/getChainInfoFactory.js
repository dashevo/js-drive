const ChainInfo = require('./ChainInfo');

/**
 * @param {RpcClient} rpcClient
 * @returns {getChainInfo}
 */
function getChainInfoFactory(rpcClient) {
  /**
   * @typedef getChainInfo
   * @returns {Promise<ChainInfo>}
   */
  async function getChainInfo() {
    const { result: blockHash } = await rpcClient.getBestBlockHash();
    const { result: lastChainBlock } = await rpcClient.getBlock(blockHash);
    const { result: { IsBlockchainSynced } } = await rpcClient.mnsync('status');
    return new ChainInfo(
      lastChainBlock.height,
      lastChainBlock.hash,
      IsBlockchainSynced,
    );
  }

  return getChainInfo;
}

module.exports = getChainInfoFactory;
