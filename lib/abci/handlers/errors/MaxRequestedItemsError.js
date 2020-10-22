class MaxRequestedItemsError extends Error {
  /**
   * @param {number} maxRequestedItems
   */
  constructor(maxRequestedItems) {
    const message = `Maximum number of requested items of ${maxRequestedItems} exceeded.`;
    super(message);
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = MaxRequestedItemsError;
