const promisifyMethods = require('../util/promisifyMethods');
const WrongBlocksSequenceError = require('./WrongBlocksSequenceError');

// TODO: It might be part of SDK in the future

module.exports = class BlockIterator {
  /**
   * @param {RpcClient} rpcClient
   * @param {number} fromBlockHeight
   */
  constructor(rpcClient, fromBlockHeight = 1) {
    this.rpcClient = rpcClient;
    this.promisifiedRpcClient = promisifyMethods(rpcClient, ['getBlockHash', 'getBlock']);

    this.setBlockHeight(fromBlockHeight);
  }

  /**
   * Set block height
   *
   * @param {number} height
   */
  setBlockHeight(height) {
    this.fromBlockHeight = height;

    this.reset();
  }

  /**
   * Reset iterator
   */
  reset() {
    this.nextBlockHash = null;
    this.nextBlockHeight = this.fromBlockHeight;

    this.previousBlock = null;
  }

  /**
   * Get next block
   *
   * @return {Promise<Object>}
   */
  async next() {
    await this.initializeNextBlockHash();

    if (this.nextBlockHash) {
      const { result: block } = await this.promisifiedRpcClient.getBlock(this.nextBlockHash);

      if (block) {
        if (!this.previousBlock) {
          this.previousBlock = block;
        } else if (!BlockIterator.isSequentialBlock(this.previousBlock, block)) {
          throw new WrongBlocksSequenceError();
        }

        this.nextBlockHeight = block.height + 1;
        this.nextBlockHash = block.nextblockhash;

        this.previousBlock = block;

        return { done: false, value: block };
      }
    }

    return { done: true };
  }

  /**
   * @private
   * @return {Promise<void>}
   */
  async initializeNextBlockHash() {
    if (this.previousBlock) {
      return;
    }

    const response = await this.promisifiedRpcClient.getBlockHash(this.nextBlockHeight);
    this.nextBlockHash = response.result;
  }

  /**
   * @private
   * @param {Object} prevBlock
   * @param {Object} block
   * @return {boolean}
   */
  static isSequentialBlock(prevBlock, block) {
    return block.previousblockhash === prevBlock.hash &&
      block.height === prevBlock.height + 1;
  }
};
