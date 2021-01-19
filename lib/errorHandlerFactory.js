/* eslint-disable no-console */

/**
 * @param {BaseLogger} logger
 * @param {AwilixContainer} container
 */
function errorHandlerFactory(logger, container) {
  /**
   * Error handler
   *
   * @param {Error} e
   */
  async function errorHandler(e) {
    (e.consensusLogger || logger).fatal(e);

    await container.dispose();

    process.exit(1);
  }

  return errorHandler;
}

module.exports = errorHandlerFactory;
