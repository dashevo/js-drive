const ValidationError = require('./ValidationError');

class NotIndexedFieldError extends ValidationError {
  /**
   *
   * @param {Array} fields
   */
  constructor(fields) {
    super(`Search fields can only contain one of these fields: ${fields.join(', ')}`);

    this.fields = fields;
  }

  /**
   * Get allowed fields
   *
   * @returns {Array}
   */
  getFields() {
    return this.fields;
  }
}

module.exports = NotIndexedFieldError;
