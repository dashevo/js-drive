const printErrorFace = require('./util/printErrorFace');

/**
 * @param {BaseLogger} logger
 * @param {AwilixContainer} container
 */
function errorHandlerFactory(logger, container) {
  let isCalledAlready = false;
  const errors = [];

  /**
   * Error handler
   *
   * @param {Error} error
   */
  async function errorHandler(error) {
    // Collect all thrown errors
    errors.push(error);

    // Gracefully shutdown only once
    if (isCalledAlready) {
      return;
    }

    isCalledAlready = true;

    try {
      try {
        // Close all ABCI server connections
        await new Promise((resolve) => {
          // Server pass an error to callback if server is not started
          // We ignore this error
          container.resolve('abciServer').close(resolve);
        });

        // Add further code to the end of event loop (the same as process.nextTick)
        await Promise.resolve();

        // eslint-disable-next-line no-console
        console.log(printErrorFace());

        errors.forEach((e) => {
          (error.consensusLogger || logger).fatal({ err: e }, e.message);
        });
      } finally {
        await container.dispose();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      process.exit(1);
    }
  }

  return errorHandler;
}

module.exports = errorHandlerFactory;
