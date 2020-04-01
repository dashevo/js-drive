class AbciError extends Error {
  /**
   * @param {number} code
   * @param {string} message
   * @param {Object=undefined} [data]
   */
  constructor(code, message, data = undefined) {
    super();

    this.name = this.constructor.name;

    this.code = code;
    this.message = message;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get message
   *
   * @return {string}
   */
  getMessage() {
    return this.message;
  }

  /**
   * Get error code
   *
   * @return {number}
   */
  getCode() {
    return this.code;
  }

  /**
   * Get data
   *
   * @return {Object}
   */
  getData() {
    return this.data;
  }
}

AbciError.CODES = {
  INTERNAL: 1,
  INVALID_ARGUMENT: 2,
  EXECUTION_TIMED_OUT: 5,
  MEMORY_LIMIT_EXCEEDED: 6,
};

module.exports = AbciError;
