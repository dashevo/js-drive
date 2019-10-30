const ValidationResult = require('./ValidationResult');
const NotIndexedFieldError = require('./errors/NotIndexedFieldError');

/**
 * Validate query to search by only indexed fields
 *
 * @typedef validateIndexedFields
 * @param {Array} dataContractIndexFields
 * @param {Object} [query] query
 * @returns {ValidationResult}
 */
function validateIndexedFields(dataContractIndexFields, query = {}) {
  // extract fields from query
  const where = query.where || [];

  const fieldsToSearch = where.map(search => search[0]);

  const result = new ValidationResult();

  const isValid = fieldsToSearch.every(v => dataContractIndexFields.includes(v));
  if (!isValid) {
    const error = new NotIndexedFieldError(dataContractIndexFields);

    result.addError(error);
  }

  return result;
}

module.exports = validateIndexedFields;
