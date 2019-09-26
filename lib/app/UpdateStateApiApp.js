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
const DashPlatformProtocol = require('@dashevo/dpp');
const { MongoClient } = require('mongodb');

const errorHandler = require('../util/errorHandler');
const jsonToProtobufHandlerWrapper = require('../grpcApi/jsonToProtobufHandlerWrapper');
const wrapInErrorHandlerFactory = require('../grpcApi/error/wrapInErrorHandlerFactory');
const startTransactionHandlerFactory = require('../grpcApi/handlers/startTransactionHandlerFactory');
const applyStateTransitionHandlerFactory = require('../grpcApi/handlers/applyStateTransitionHandlerFactory');
const commitTransactionHandlerFactory = require('../grpcApi/handlers/commitTransactionHandlerFactory');
const createContractDatabaseFactory = require('../stateView/contract/createContractDatabaseFactory');
const removeContractDatabaseFactory = require('../stateView/contract/removeContractDatabaseFactory');
const SVContractMongoDbRepository = require('../stateView/contract/SVContractMongoDbRepository');
const MongoDBTransaction = require('../mongoDb/MongoDBTransaction');
const SVDocumentMongoDbRepository = require('../stateView/document/mongoDbRepository/SVDocumentMongoDbRepository');
const createSVDocumentMongoDbRepositoryFactory = require('../stateView/document/mongoDbRepository/createSVDocumentMongoDbRepositoryFactory');
const convertWhereToMongoDbQuery = require('../stateView/document/mongoDbRepository/convertWhereToMongoDbQuery');
const validateQueryFactory = require('../stateView/document/query/validateQueryFactory');
const findConflictingConditions = require('../stateView/document/query/findConflictingConditions');
const applyStateTransitionFactory = require('../stateView/applyStateTransitionFactory');
const updateSVContractFactory = require('../stateView/contract/updateSVContractFactory');
const updateSVDocumentFactory = require('../stateView/document/updateSVDocumentFactory');
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
    this.mongoDb = null;
    this.stateViewTransaction = null;
    this.createSVDocumentRepository = null;
    this.svContractMongoDbRepository = null;
  }

  /**
   * Init UpdateStateApiApp
   * @returns {Promise<void>}
   */
  async init() {
    this.mongoClient = await MongoClient.connect(
      this.options.getStorageMongoDbUrl(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    this.stateViewTransaction = new MongoDBTransaction(this.mongoClient);
    this.mongoDb = this.mongoClient.db(this.options.getStorageMongoDbDatabase());
    const validateQuery = validateQueryFactory(findConflictingConditions);
    this.createSVDocumentRepository = createSVDocumentMongoDbRepositoryFactory(
      this.mongoClient,
      SVDocumentMongoDbRepository,
      convertWhereToMongoDbQuery,
      validateQuery,
    );
    this.svContractMongoDbRepository = new SVContractMongoDbRepository(
      this.mongoDb,
      new DashPlatformProtocol(),
    );
  }

  /**
   * Wraps handlers error handler for gRpc server
   *
   * @returns {Object}
   */
  createWrappedHandlers() {
    const wrappedHandlers = {};
    const handlers = this.createHandlers();

    for (const handler of handlers) {
      handlers[rmPostfix(handler)] = this.wrapHandler(handler);
    }

    return wrappedHandlers;
  }

  /**
   * Create handlers for gRpc server
   * @private
   * @returns {[<startTransactionHandler, applyStateTransitionHandler, commitTransactionHandler>]}
   */
  createHandlers() {
    return [
      this.createStartTransactionHandler(),
      this.createApplyStateTransitionHandler(),
      this.createCommitTransactionHandler(),
    ];
  }

  /**
   * Wrap RPC handler in error handler
   *
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
    const updateSVContract = updateSVContractFactory(this.svContractMongoDbRepository);
    const updateSVDocument = updateSVDocumentFactory(this.createSVDocumentRepository);
    const applyStateTransition = applyStateTransitionFactory(updateSVContract, updateSVDocument);

    return applyStateTransitionHandlerFactory(
      this.stateViewTransaction,
      new DashPlatformProtocol(),
      applyStateTransition,
    );
  }

  /**
   * @private
   * @returns {commitTransactionHandler}
   */
  createCommitTransactionHandler() {
    const createContractDatabase = createContractDatabaseFactory(this.createSVDocumentRepository);
    const removeContractDatabase = removeContractDatabaseFactory(this.createSVDocumentRepository);

    return commitTransactionHandlerFactory(
      this.stateViewTransaction,
      this.svContractMongoDbRepository,
      createContractDatabase,
      removeContractDatabase,
    );
  }
}

module.exports = UpdateStateApiApp;
