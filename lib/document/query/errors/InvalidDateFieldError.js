const ValidationError = require('./ValidationError');

class InvalidDateFieldError extends ValidationError {
  /**
   * @param {string} fieldName
   */
  constructor(fieldName) {
    super(`Date field "${fieldName}" should be passed as a number into query`);

    this.fieldName = fieldName;
  }

  /**
   * Get invalid date field name
   *
   * @returns {string}
   */
  getFieldName() {
    return this.fieldName;
  }
}

module.exports = InvalidDateFieldError;
