class DPPValidationError extends Error {
  /**
   *
   * @param {string} message
   * @param {ValidationResult} validationResult
   */
  constructor(message, validationResult) {
    super(`DPP validation error: ${message}`);

    this.validationResult = validationResult;
  }

  getCode() {
    return this.validationResult.getErrors()[0].getCode();
  }

  getInfo() {
    return this.validationResult.getErrors()[0].getConstructorArguments();
  }
}

module.exports = DPPValidationError;
