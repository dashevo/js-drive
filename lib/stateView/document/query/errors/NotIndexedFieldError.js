const ValidationError = require('./ValidationError');

class NotIndexedFieldError extends ValidationError {
  constructor(fields) {
    super(`Search fields can only contain one of these fields: ${fields.join(', ')}`);
  }
}

module.exports = NotIndexedFieldError;
