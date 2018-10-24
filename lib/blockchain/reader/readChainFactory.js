/**
 * @param {STHeadersReader} stHeadersReader
 * @param {RpcClient} rpcClient
 * @returns {readChain}
 */
function readChainFactory(stHeadersReader, rpcClient) {
  /**
   * @typedef {Promise} readChain
   * @returns {Promise<void>}
   */
  async function readChain() {
    const { result: blocksCount } = await rpcClient.getBlockCount();

    // Start from the first Evo block
    let height = stHeadersReader.getInitialBlockHeight();

    if (blocksCount < height) {
      // TODO: log that there is no evo blocks in chain
      return;
    }

    // Switch to last synced block + 1 if present
    const lastBlock = stHeadersReader.getState().getLastBlock();
    if (lastBlock) {
      height = lastBlock.height + 1;
    }

    // Start from chain height If it less than last synced block
    if (blocksCount < height) {
      height = blocksCount;
    }

    stHeadersReader.stHeaderIterator.blockIterator.setBlockHeight(height);
    stHeadersReader.stHeaderIterator.reset(false);

    await stHeadersReader.read();
  }

  return readChain;
}

module.exports = readChainFactory;
