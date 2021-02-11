const printErrorFace = require('./util/printErrorFace');

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
    // eslint-disable-next-line no-console
    console.log(printErrorFace());

    (e.consensusLogger || logger).fatal({ err: e }, e.message);

    await container.dispose();

    process.exit(1);
  }

  return errorHandler;
}

module.exports = errorHandlerFactory;
