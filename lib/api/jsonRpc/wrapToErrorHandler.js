const { Server: { errors } } = require('jayson');
const createError = require('./createError');
const InvalidParamsError = require('../InvalidParamsError');

/**
 * Wrap API method to JSON RPC method handler
 *
 * @param {Function} method Api method
 * @param {Logger} logger
 * @return {Function}
 * @throws {Error}
 */
module.exports = function wrapToErrorHandler(method, logger) {
  return async function apiMethodErrorHandler(params) {
    try {
      return await method(params);
    } catch (e) {
      if (e instanceof InvalidParamsError) {
        throw createError(errors.INVALID_PARAMS, e.message, e.data);
      }

      logger.error(`Error in ${method.name} API method`, { params }, e);

      throw e;
    }
  };
};
