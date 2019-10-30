const ValidationError = require('./ValidationError');

class InvalidDocumentTypeError extends ValidationError {
  /**
   *
   * @param {string} type
   */
  constructor(type) {
    super(`Invalid document type: ${type}`);

    this.type = type;
  }

  /**
   * Invalid document type
   *
   * @returns {string}
   */
  getDocumentType() {
    return this.type;
  }
}

module.exports = InvalidDocumentTypeError;
