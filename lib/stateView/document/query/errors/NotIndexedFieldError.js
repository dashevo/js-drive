const ValidationError = require('./ValidationError');

class NotIndexedFieldError extends ValidationError {
  /**
   *
   * @param {string} field
   */
  constructor(field) {
    super(`Search by not indexed field "${field}" is not allowed`);

    this.field = field;
  }

  /**
   * Get allowed fields
   *
   * @returns {string}
   */
  getIndexedField() {
    return this.field;
  }
}

module.exports = NotIndexedFieldError;
