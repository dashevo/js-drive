class CreditsDistributionPool {
  /**
   *
   * @param {number} [amount]
   */
  constructor(
    amount = 0,
  ) {
    this.amount = amount;
  }

  /**
   * Set credits distribution pool
   *
   * @param {number} amount
   * @return {CreditsDistributionPool}
   */
  setAmount(amount) {
    this.amount = amount;

    return this;
  }

  /**
   * Increment credits distribution pool
   *
   * @param {number} amount
   * @return {CreditsDistributionPool}
   */
  incrementAmount(amount) {
    this.amount += amount;

    return this;
  }

  /**
   * Get credits distribution pool
   *
   * @return {number}
   */
  getAmount() {
    return this.amount;
  }

  /**
   * Get plain JS object
   *
   * @return {{
   *    amount: number,
   * }}
   */
  toJSON() {
    return {
      amount: this.getAmount(),
    };
  }
}

module.exports = CreditsDistributionPool;
