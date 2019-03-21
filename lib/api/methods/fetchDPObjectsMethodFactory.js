const InvalidParamsError = require('../InvalidParamsError');
const InvalidWhereError = require('../../stateView/document/errors/InvalidWhereError');
const InvalidOrderByError = require('../../stateView/document/errors/InvalidOrderByError');
const InvalidLimitError = require('../../stateView/document/errors/InvalidLimitError');
const InvalidStartAtError = require('../../stateView/document/errors/InvalidStartAtError');
const InvalidStartAfterError = require('../../stateView/document/errors/InvalidStartAfterError');
const AmbiguousStartError = require('../../stateView/document/errors/AmbiguousStartError');

/**
 * @param {fetchDPObjects} fetchDPObjects
 * @returns {fetchDPObjectsMethod}
 */
module.exports = function fetchDPObjectsMethodFactory(fetchDPObjects) {
  /**
   * @typedef {Promise} fetchDPObjectsMethod
   * @param {{ contractId: string, type: string, options: Object }} params
   * @returns {Promise<Object[]>}
   */
  async function fetchDPObjectsMethod(params) {
    if (!params.contractId || !params.type) {
      throw new InvalidParamsError();
    }

    try {
      const dpObjects = await fetchDPObjects(params.contractId, params.type, params.options);

      return dpObjects.map(o => o.toJSON());
    } catch (error) {
      switch (error.constructor) {
        case InvalidWhereError:
        case InvalidOrderByError:
        case InvalidLimitError:
        case InvalidStartAtError:
        case InvalidStartAfterError:
        case AmbiguousStartError:
          throw new InvalidParamsError();
        default:
          throw error;
      }
    }
  }

  return fetchDPObjectsMethod;
};
