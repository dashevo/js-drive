const {
  LastUserStateTransitionHashRequest,
  utils: {
    jsonToProtobufFactory,
    protobufToJsonFactory,
  },
  pbjs: {
    LastUserStateTransitionHashRequest: PBJSLastUserStateTransitionHashRequest,
    LastUserStateTransitionHashResponse: PBJSLastUserStateTransitionHashResponse,
  },
} = require('@dashevo/drive-grpc');
const { MongoClient } = require('mongodb');

const errorHandler = require('../util/errorHandler');
const jsonToProtobufHandlerWrapper = require('../grpcApi/jsonToProtobufHandlerWrapper');
const wrapInErrorHandlerFactory = require('../grpcApi/error/wrapInErrorHandlerFactory');

const startTransactionHandlerFactory = require('../grpcApi/handlers/startTransactionHandlerFactory');
const applyStateTransitionHandlerFactory = require('../grpcApi/handlers/applyStateTransitionHandlerFactory');
const commitTransactionHandlerFactory = require('../grpcApi/handlers/commitTransactionHandlerFactory');
const createContractDatabaseFactory = require('../stateView/contract/createContractDatabaseFactory');

const MongoDBTransaction = require('../mongoDb/MongoDBTransaction');
const SVDocumentMongoDbRepository = require('../stateView/document/mongoDbRepository/SVDocumentMongoDbRepository');
const createSVDocumentMongoDbRepositoryFactory = require('../stateView/document/mongoDbRepository/createSVDocumentMongoDbRepositoryFactory');
const convertWhereToMongoDbQuery = require('../stateView/document/mongoDbRepository/convertWhereToMongoDbQuery');
const validateQueryFactory = require('../stateView/document/query/validateQueryFactory');
const findConflictingConditions = require('../stateView/document/query/findConflictingConditions');

/**
 * Remove 'Handler' Postfix
 *
 * Takes a function as an argument, returns the function's name
 * as a string without 'Handler' as a postfix.
 *
 * @param {function} func Function that uses 'Method' postfix
 * @returns {string} String of function name without 'Method' postfix
 */
function rmPostfix(func) {
  const funcName = func.name;

  return funcName.substr(0, funcName.length - 'Handler'.length);
}

class UpdateStateApiApp {
  /**
   *
   * @param {UpdateStateApiAppOptions} options
   */
  constructor(options) {
    this.options = options;
    this.mongoClient = null;
    this.stateViewTransaction = null;
  }

  /**
   * Init UpdateStateApiApp
   * @returns {Promise<void>}
   */
  async init() {
    this.mongoClient = await MongoClient.connect(
      this.options.getStorageMongoDbUrl(),
      { useNewUrlParser: true },
    );

    this.stateViewTransaction = new MongoDBTransaction(this.mongoClient);
  }

  createWrappedHandlers() {
    const wrappedHandlers = {};
    const handlers = this.createHandlers();

    for (const handler of handlers) {
      handlers[rmPostfix(handler)] = this.wrapHandler(handler);
    }

    return wrappedHandlers;
  }

  /**
   * Create handlers for gRpc
   * @private
   * @returns {{startTransaction: {Function},
   *   applyStateTransition: {Function},
   *   commitTransaction: {Function}}}
   */
  createHandlers() {
    return [
      this.createStartTransactionHandler(),
      this.createApplyStateTransitionHandler(),
      this.createCommitTransactionHandler(),
    ];
  }

  /**
   * @private
   * @param {Function} handler
   * @returns {wrappedMethodHandler}
   */
  wrapHandler(handler) {
    const wrapInErrorHandler = wrapInErrorHandlerFactory(errorHandler);

    return jsonToProtobufHandlerWrapper(
      jsonToProtobufFactory(
        LastUserStateTransitionHashRequest,
        PBJSLastUserStateTransitionHashRequest,
      ),
      protobufToJsonFactory(
        PBJSLastUserStateTransitionHashResponse,
      ),
      wrapInErrorHandler(handler),
    );
  }

  /**
   * @private
   * @returns {startTransactionHandler}
   */
  createStartTransactionHandler() {
    return startTransactionHandlerFactory(this.stateViewTransaction);
  }

  /**
   * @private
   * @returns {applyStateTransitionHandler}
   */
  createApplyStateTransitionHandler() {
    return applyStateTransitionHandlerFactory(this.stateViewTransaction);
  }

  /**
   * @private
   * @returns {commitTransactionHandler}
   */
  createCommitTransactionHandler() {
    const validateQuery = validateQueryFactory(findConflictingConditions);
    const createSVDocumentRepository = createSVDocumentMongoDbRepositoryFactory(
      this.mongoClient,
      SVDocumentMongoDbRepository,
      convertWhereToMongoDbQuery,
      validateQuery,
    );
    const createContractDatabase = createContractDatabaseFactory(createSVDocumentRepository);

    return commitTransactionHandlerFactory(
      this.stateViewTransaction,
      createContractDatabase,
    );
  }
}

module.exports = UpdateStateApiApp;
