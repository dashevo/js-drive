/**
 * @param {Object} logger
 * @return {wrapHandlerWithLogger}
 */
function wrapHandlerWithLoggerFactory(logger) {
  /**
   * Log inputs and outputs of the method
   *
   * @typedef wrapHandlerWithLogger
   * @param {Function} method
   * @return {Function}
   */
  function wrapHandlerWithLogger(method) {
    /**
     * Internal method handler
     * @param {abci.IRequest} request
     * @return {Promise<abci.IResponse>}
     */
    async function methodHandler(request) {
      const enterMessage = `Executing ABCI method ${method.name} with request:`
        + `${JSON.stringify(request, undefined, 2)}`;

      logger.debug(enterMessage);

      const response = await method(request);

      const exitMessage = `Finished executing ABCI method ${method.name} with response:`
        + `${JSON.stringify(response, undefined, 2)}`;

      logger.debug(exitMessage);

      return response;
    }

    return methodHandler;
  }

  return wrapHandlerWithLogger;
}

module.exports = wrapHandlerWithLoggerFactory;
