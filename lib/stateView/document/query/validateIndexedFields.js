const ValidationResult = require('./ValidationResult');
const ValidationError = require('./errors/ValidationError');

/**
 * Validate query to search by only indexed fields
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
    const message = `Search fields can only contain one of these fields: ${dataContractIndexFields.join(', ')}`;

    const error = new ValidationError(message);

    result.addError(error);
  }

  return result;
}

module.exports = validateIndexedFields;
