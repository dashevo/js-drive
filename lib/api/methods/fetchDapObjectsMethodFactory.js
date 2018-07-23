const InvalidParamsError = require('../InvalidParamsError');

/**
 * @param fetchDapObjects
 * @returns {fetchDapObjectsMethod}
 */
module.exports = function fetchDapObjectsMethodFactory(fetchDapObjects) {
  /**
   * @typedef {Promise} fetchDapObjectsMethod
   * @param {string} dapId
   * @param {string} type
   * @param {object} options
   * @returns {Promise<object[]>}
   */
  async function fetchDapObjectsMethod({ dapId, type, options } = {}) {
    if (!dapId || !type) {
      throw new InvalidParamsError();
    }

    const dapObjects = await fetchDapObjects(dapId, type, options);
    return dapObjects.map(dapObject => dapObject.toJSON());
  }

  return fetchDapObjectsMethod;
};
