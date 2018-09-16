class ChainInfo {
  /**
   * @param {string} lastChainBlockHeight
   * @param {string} lastChainBlockHash
   * @param {boolean} isBlockchainSynced
   */
  constructor(lastChainBlockHeight, lastChainBlockHash, isBlockchainSynced) {
    this.lastChainBlockHeight = lastChainBlockHeight;
    this.lastChainBlockHash = lastChainBlockHash;
    this.isBlockchainSynced = isBlockchainSynced;
  }

  /**
   * Returns ChainInfo JSON representation
   *
   * @returns {{lastChainBlockHeight: string, lastChainBlockHash: string,
   *              isBlockchainSynced: boolean}}
   */
  toJSON() {
    return {
      lastChainBlockHeight: this.lastChainBlockHeight,
      lastChainBlockHash: this.lastChainBlockHash,
      isBlockchainSynced: this.isBlockchainSynced,
    };
  }
}

module.exports = ChainInfo;
