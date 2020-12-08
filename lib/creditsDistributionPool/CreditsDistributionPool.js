class CreditsDistributionPool {
  /**
   *
   * @param {number} [creditsDistributionPool]
   */
  constructor(
    creditsDistributionPool = 0,
  ) {
    this.creditsDistributionPool = creditsDistributionPool;
  }

  /**
   * Set credits distribution pool
   *
   * @param {number} credits
   * @return {CreditsDistributionPool}
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
   * Get plain JS object
   *
   * @return {{
   *    creditsDistributionPool: number,
   * }}
   */
  toJSON() {
    return {
      creditsDistributionPool: this.getCreditsDistributionPool(),
    };
  }
}

module.exports = CreditsDistributionPool;
