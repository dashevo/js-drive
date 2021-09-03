class DPPValidationError extends Error {
  /**
   *
   * @param {string} message
   * @param {AbstractConsenusError[]} errors
   */
  constructor(message, errors) {
    super(message);

    this.errors = errors;
  }

  getCode() {
    return this.errors[0].getCode();
  }

  getInfo() {
    return this.errors[0].getConstructorArguments();
  }
}

module.exports = DPPValidationError;
