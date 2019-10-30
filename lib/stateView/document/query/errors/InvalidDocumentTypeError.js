const ValidationError = require('./ValidationError');

class InvalidDocumentTypeError extends ValidationError {
  constructor(type) {
    super(`Invalid document type: ${type}`);
  }
}

module.exports = InvalidDocumentTypeError;
