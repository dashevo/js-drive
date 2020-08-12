const Long = require('long');

class BlockchainState {
  /**
   *
   * @param {number} [appVersion] - Protocol version
   * @param {Long} [lastBlockHeight]
   * @param {Buffer} [lastBlockAppHash]
   * @param {number} [creditsDistributionPool]
   */
  constructor(
    appVersion = 0,
    lastBlockHeight = Long.fromInt(0),
    lastBlockAppHash = Buffer.alloc(0),
    creditsDistributionPool = 0,
  ) {
    this.appVersion = appVersion;
    this.lastBlockHeight = lastBlockHeight;
    this.lastBlockAppHash = lastBlockAppHash;
    this.creditsDistributionPool = creditsDistributionPool;
  }

  /**
   * Get last block height
   *
   * @return {Long}
   */
  getLastBlockHeight() {
    return this.lastBlockHeight;
  }

  /**
   * Set last block height
   *
   * @param {Long} blockHeight
   * @return {BlockchainState}
   */
  setLastBlockHeight(blockHeight) {
    this.lastBlockHeight = blockHeight;

    return this;
  }

  /**
   * Get last block app hash
   *
   * @return {Buffer}
   */
  getLastBlockAppHash() {
    return this.lastBlockAppHash;
  }

  /**
   * Set last block app hash
   *
   * @param {Buffer} appHash
   * @return {BlockchainState}
   */
  setLastBlockAppHash(appHash) {
    this.lastBlockAppHash = appHash;

    return this;
  }

  /**
   * Set credits distribution pool
   *
   * @param {number} credits
   * @return {BlockchainState}
   */
  setCreditsDistributionPool(credits) {
    this.creditsDistributionPool = credits;

    return this;
  }

  /**
   * Get credits distribution pool
   *
   * @return {number}
   */
  getCreditsDistributionPool() {
    return this.creditsDistributionPool;
  }

  /**
   * Get the current Drive’s protocol version
   *
   * @return {number}
   */
  getAppVersion() {
    return this.appVersion;
  }

  /**
   * Get plain JS object
   *
   * @return {{
   *    version: string,
   *    appVersion: number,
   *    lastBlockHeight: string,
   *    lastBlockAppHash: Buffer,
   *    creditsDistributionPool: number,
   * }}
   */
  toJSON() {
    return {
      appVersion: this.getAppVersion(),
      lastBlockHeight: this.getLastBlockHeight().toString(),
      lastBlockAppHash: this.getLastBlockAppHash(),
      creditsDistributionPool: this.getCreditsDistributionPool(),
    };
  }
}

module.exports = BlockchainState;
