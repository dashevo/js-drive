/**
 * @param {RpcClient} rpcClient
 * @returns {getLastBlock}
 */
function getLastBlockFactory(rpcClient) {
  /**
   * @typedef getLastBlock
   * @returns {Promise<Object>}
   */
  async function getLastBlock() {
    const { result: blockHash } = await rpcClient.getBestBlockHash();
    const { result: lastBestBlock } = await rpcClient.getBlock(blockHash);
    return lastBestBlock;
  }

  return getLastBlock;
}

module.exports = getLastBlockFactory;
