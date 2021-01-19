/**
 * Add consensus logger to an error (factory)
 *
 * @param {blockExecutionContext} blockExecutionContext
 *
 * @return {enrichErrorWithConsensusError}
 */
function enrichErrorWithConsensusErrorFactory(blockExecutionContext) {
  /**
   * Add consensus logger to an error
   *
   * @typedef enrichErrorWithConsensusError
   *
   * @param {Function} method
   *
   * @return {Function}
   */
  function enrichErrorWithConsensusError(method) {
    /**
     * @param {*} request
     */
    async function methodHandler(request) {
      try {
        return await method(request);
      } catch (e) {
        const consensusLogger = blockExecutionContext.getConsensusLogger();

        if (consensusLogger) {
          e.consensusLogger = consensusLogger;
        }

        throw e;
      }
    }

    return methodHandler;
  }

  return enrichErrorWithConsensusError;
}

module.exports = enrichErrorWithConsensusErrorFactory;
