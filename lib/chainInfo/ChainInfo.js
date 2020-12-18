const Long = require('long');

class ChainInfo {
  /**
   *
   * @param {Long} [lastBlockHeight]
   */
  constructor(
    lastBlockHeight = Long.fromInt(0),
    lastCoreChainLockedHeight,
  ) {
    this.lastBlockHeight = lastBlockHeight;
    this.lastCoreChainLockedHeight = lastCoreChainLockedHeight;
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
   * @return {ChainInfo}
   */
  setLastBlockHeight(blockHeight) {
    this.lastBlockHeight = blockHeight;

    return this;
  }

  /**
   * Get last core chain locked height
   *
   * @return {Long}
   */
  getLastCoreChainLockedHeight() {
    return this.lastBlockHeight;
  }

  /**
   * Set last core chain locked height
   *
   * @param {Long} height
   * @return {ChainInfo}
   */
  setLastCoreChainLockedHeight(height) {
    this.lastCoreChainLockedHeight = height;

    return this;
  }

  /**
   * Get plain JS object
   *
   * @return {{
   *    lastBlockHeight: string,
   * }}
   */
  toJSON() {
    return {
      lastBlockHeight: this.getLastBlockHeight().toString(),
    };
  }
}

module.exports = ChainInfo;
