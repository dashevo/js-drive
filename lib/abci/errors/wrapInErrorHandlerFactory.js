const GrpcError = require('@dashevo/grpc-common/lib/server/error/GrpcError');
const InternalGrpcError = require('@dashevo/grpc-common/lib/server/error/InternalGrpcError');
const VerboseInternalGrpcError = require('@dashevo/grpc-common/lib/server/error/VerboseInternalGrpcError');

/**
 * @param {BaseLogger} logger
 * @param {boolean} isProductionEnvironment
 *
 * @return wrapInErrorHandler
 */
function wrapInErrorHandlerFactory(logger, isProductionEnvironment) {
  /**
   * Wrap ABCI methods in error handler
   *
   * @typedef wrapInErrorHandler
   *
   * @param {Function} method
   * @param {Object} [options={}]
   * @param {boolean} [options.throwNonABCIErrors=true]
   *
   * @return {Function}
   */
  function wrapInErrorHandler(method, options = {}) {
    // eslint-disable-next-line no-param-reassign
    options = {
      respondWithInternalError: false,
      ...options,
    };

    /**
     * @param request
     */
    async function methodErrorHandler(request) {
      try {
        return await method(request);
      } catch (e) {
        let error = e;

        // Wrap all non ABCI errors to an internal ABCI error
        if (!(e instanceof GrpcError)) {
          error = new InternalGrpcError(e);
        }

        // Log only internal ABCI errors
        if (error instanceof InternalGrpcError) {
          // in consensus ABCI handlers (blockBegin, deliverTx, blockEnd, commit)
          // we should propagate the error upwards
          // to halt the Drive
          // in order cases like query and checkTx
          // we need to respond with internal errors
          if (!options.respondWithInternalError) {
            throw error.getError();
          }

          const originalError = error.getError();

          (originalError.consensusLogger || logger).error(
            { err: originalError },
            originalError.message,
          );

          if (!isProductionEnvironment) {
            error = new VerboseInternalGrpcError(error);
          }
        }

        return {
          code: error.getCode(),
          log: JSON.stringify({
            error: {
              message: error.getMessage(),
              data: error.getRawMetadata(),
            },
          }),
        };
      }
    }

    return methodErrorHandler;
  }

  return wrapInErrorHandler;
}

module.exports = wrapInErrorHandlerFactory;
