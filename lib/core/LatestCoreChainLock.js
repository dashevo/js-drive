class LatestCoreChainLock {
  /**
   *
   * @param {string} [chainLock]
   * @param {LatestCoreChainLock}
   */
  constructor(chainLock = undefined) {
    this.chainLock = chainLock || undefined;
  }

  /**
   * Update latest chainlock
   *
   * @param {string} chainLock
   * @return {LatestCoreChainLock}
   */
  update(chainLock) {
    this.chainLock = chainLock;
    return this;
  }
}

module.exports = LatestCoreChainLock;
