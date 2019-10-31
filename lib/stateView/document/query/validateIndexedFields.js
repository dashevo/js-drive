/**
 * Validate query to search by only indexed fields
 *
 * @typedef validateIndexedFields
 * @param {Array} dataContractIndexFields
 * @param {Array} conditions
 * @returns {Array}
 */
function validateIndexedFields(dataContractIndexFields, conditions) {
  return conditions
    .map(([field]) => field)
    .filter(field => !dataContractIndexFields.includes(field));
}

module.exports = validateIndexedFields;
