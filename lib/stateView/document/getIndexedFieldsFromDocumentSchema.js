/**
 * Extract indexed fields from document schema
 *
 * @param {Object} documentSchema
 * @returns {Array}
 */
function getIndexedFieldsFromDocumentSchema(documentSchema) {
  let indexFields = documentSchema.indices || [];

  // extract all index fields
  indexFields = indexFields
    .map((index) => {
      const fields = index.properties.reduce((result, item) => {
        const [[field]] = Object.entries(item);
        return result.concat(field);
      }, []);
      return fields;
    })
    // flat array
    .reduce((result, item) => result.concat(item), []);

  // make values unique
  indexFields = [...new Set(indexFields)];

  // add system field $id
  indexFields.push('$id');

  return indexFields;
}

module.exports = getIndexedFieldsFromDocumentSchema;
