/* eslint-disable no-console */
const Emittery = require('emittery');

// TODO: It might be part of SDK in the future

class RpcBlockIterator extends Emittery {
  /**
   * @param {RpcClient} rpcClient
   * @param {number} fromBlockHeight
   */
  constructor(rpcClient, fromBlockHeight = 1) {
    super();

    this.rpcClient = rpcClient;

    this.setBlockHeight(fromBlockHeight);
  }

  /**
   * Set block height since iterator starts
   *
   * @param {number} height
   */
  setBlockHeight(height) {
    this.fromBlockHeight = height;

    this.reset();
  }

  /**
   * Get current block height
   *
   * @return {number}
   */
  getBlockHeight() {
    if (this.currentBlock) {
      return this.currentBlock.height;
    }

    return this.fromBlockHeight;
  }

  /**
   * Reset iterator
   */
  reset() {
    this.nextBlockHash = null;

    this.currentBlock = null;
    this.firstIteration = true;
  }

  isDone() {
    return this.currentBlock && this.currentBlock.nextblockhash;
  }

  /**
   * Get next block
   *
   * @return {Promise<Object>}
   */
  async next() {
    await this.initializeNextBlockHash();

    if (this.nextBlockHash) {
      const { result: block } = await this.rpcClient.getBlock(this.nextBlockHash);

      this.currentBlock = block;
      this.nextBlockHash = block.nextblockhash;

      console.log(`Emit block event: ${block.height}`);

      await this.emitSerial('block', block);

      return { done: false, value: block };
    }

    return { done: true };
  }

  /**
   * @private
   * @return {Promise<void>}
   */
  async initializeNextBlockHash() {
    if (!this.firstIteration) {
      return;
    }

    const response = await this.rpcClient.getBlockHash(this.fromBlockHeight);
    this.nextBlockHash = response.result;
    this.firstIteration = false;
  }
}

module.exports = RpcBlockIterator;
