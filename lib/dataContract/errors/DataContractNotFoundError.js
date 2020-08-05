class DataContractNotFoundError extends Error {
  /**
   * @param {string} dataContractId
   */
  constructor(dataContractId) {
    super('Data contract not found');

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);

    this.dataContractId = dataContractId;
  }

  /**
   * Get data contract id
   *
   * @return {string}
   */
  getDataContractId() {
    return this.dataContractId;
  }
}

module.exports = DataContractNotFoundError;
