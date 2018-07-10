/**
 * @private
 * @param value
 * @return {boolean}
 */
function isObject(value) {
  return typeof value === 'object' && Array.isArray(value) === false;
}

/**
 * @private
 * @param {object} data
 * @param {object} updatedData
 * @param {boolean} unsanitize
 */
function updateData(data, updatedData, unsanitize = false) {
  Object.keys(data).forEach((field) => {
    let updatedField = field;

    if (field.startsWith('$')) {
      if (unsanitize) {
        updatedField = field.substr(1);
      } else {
        updatedField = `$${field}`;
      }
    }

    if (isObject(data[field])) {
      // eslint-disable-next-line no-param-reassign
      updatedData[updatedField] = {};
      updateData(data[field], updatedData[updatedField], unsanitize);
    } else {
      // eslint-disable-next-line no-param-reassign
      updatedData[updatedField] = data[field];
    }
  });
}

/**
 * Sanitize data before inserting to MongoDB
 *
 * @param {Object} data
 * @return {Object}
 */
module.exports.sanitize = function sanitize(data) {
  const sanitizedData = {};

  updateData(data, sanitizedData);

  return sanitizedData;
};

/**
 * Unsanitize data after obtaining from MongoDB
 *
 * @param {Object} data
 * @return {Object}
 */
module.exports.unsanitize = function unsanitize(data) {
  const unsanitizedData = {};

  updateData(data, unsanitizedData, true);

  return unsanitizedData;
};
