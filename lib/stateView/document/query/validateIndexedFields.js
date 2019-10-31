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
    .reduce((fields, [field, operator, elementMatchValue]) => {
      let fieldsToAdd = [];

      if (operator === 'elementMatch') {
        fieldsToAdd = elementMatchValue.map(([item]) => `${field}.${item}`);
      } else {
        fieldsToAdd = [field];
      }

      return fields.concat(fieldsToAdd);
    }, [])
    .filter(field => !dataContractIndexFields.includes(field));
}

module.exports = validateIndexedFields;
