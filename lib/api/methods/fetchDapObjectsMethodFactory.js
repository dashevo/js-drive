const InvalidParamsError = require('../InvalidParamsError');
const InvalidWhereError = require('../../stateView/dapObject/InvalidWhereError');
const InvalidOrderByError = require('../../stateView/dapObject/InvalidOrderByError');
const InvalidLimitError = require('../../stateView/dapObject/InvalidLimitError');
const InvalidStartAtError = require('../../stateView/dapObject/InvalidStartAtError');
const InvalidStartAfterError = require('../../stateView/dapObject/InvalidStartAfterError');

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

    try {
      const dapObjects = await fetchDapObjects(dapId, type, options);
      return dapObjects.map(dapObject => dapObject.toJSON());
    } catch (error) {
      if (error instanceof InvalidWhereError) {
        throw new InvalidParamsError();
      }
      if (error instanceof InvalidOrderByError) {
        throw new InvalidParamsError();
      }
      if (error instanceof InvalidLimitError) {
        throw new InvalidParamsError();
      }
      if (error instanceof InvalidStartAtError) {
        throw new InvalidParamsError();
      }
      if (error instanceof InvalidStartAfterError) {
        throw new InvalidParamsError();
      }
      throw error;
    }
  }

  return fetchDapObjectsMethod;
};
