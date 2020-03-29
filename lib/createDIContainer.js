const {
  createContainer: createAwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
} = require('awilix');

// eslint-disable-next-line import/no-unresolved
const level = require('level-rocksdb');

const LRUCache = require('lru-cache');

const { MongoClient } = require('mongodb');

const RpcClient = require('@dashevo/dashd-rpc/promise');

const DashPlatformProtocol = require('@dashevo/dpp');

const Logger = require('./util/Logger');

const IdentityLevelDBRepository = require('./identity/IdentityLevelDBRepository');

const DataContractLevelDBRepository = require('./dataContract/DataContractLevelDBRepository');

const findNotIndexedOrderByFields = require('./document/query/findNotIndexedOrderByFields');
const findNotIndexedFields = require('./document/query/findNotIndexedFields');
const getIndexedFieldsFromDocumentSchema = require('./document/query/getIndexedFieldsFromDocumentSchema');
const findConflictingConditions = require('./document/query/findConflictingConditions');

const checkReplicaSetInit = require('./mongoDb/checkReplicaSetInit');
const getDocumentsDatabaseFactory = require('./document/mongoDbRepository/getDocumentsDatabaseFactory');
const validateQueryFactory = require('./document/query/validateQueryFactory');
const convertWhereToMongoDbQuery = require('./document/mongoDbRepository/convertWhereToMongoDbQuery');
const createDocumentMongoDbRepositoryFactory = require('./document/mongoDbRepository/createDocumentMongoDbRepositoryFactory');
const fetchDocumentsFactory = require('./document/fetchDocumentsFactory');
const MongoDBTransaction = require('./mongoDb/MongoDBTransaction');

const BlockExecutionState = require('./blockchainState/blockExecution/BlockExecutionState');
const BlockchainStateLevelDBRepository = require('./blockchainState/BlockchainStateLevelDBRepository');
const BlockExecutionDBTransactions = require('./blockchainState/blockExecution/BlockExecutionDBTransactions');


const createIsolatedValidatorSnapshot = require('./dpp/isolation/validator/createIsolatedValidatorSnapshot');
const createIsolatedDppFactory = require('./dpp/isolation/validator/createIsolatedDppFactory');
const unserializeStateTransitionFactory = require(
  './abci/handlers/stateTransition/unserializeStateTransitionFactory',
);

const DriveDataProvider = require('./dpp/DriveDataProvider');
const CachedDataProviderDecorator = require('./dpp/CachedDataProviderDecorator');

const wrapInErrorHandlerFactory = require('./abci/errors/wrapInErrorHandlerFactory');
const checkTxHandlerFactory = require('./abci/handlers/checkTxHandlerFactory');
const commitHandlerFactory = require('./abci/handlers/commitHandlerFactory');
const deliverTxHandlerFactory = require('./abci/handlers/deliverTxHandlerFactory');
const infoHandlerFactory = require('./abci/handlers/infoHandlerFactory');
const beginBlockHandlerFactory = require('./abci/handlers/beginBlockHandlerFactory');
const queryHandlerFactory = require('./abci/handlers/queryHandlerFactory');

/**
 *
 * @param {Object} options
 * @param {string} options.ABCI_HOST
 * @param {string} options.ABCI_PORT
 * @param {string} options.BLOCKCHAIN_STATE_LEVEL_DB_FILE
 * @param {string} options.DATA_CONTRACT_CACHE_SIZE
 * @param {string} options.IDENTITY_LEVEL_DB_FILE
 * @param {string} options.TENDERMINT_RPC_HOST
 * @param {string} options.TENDERMINT_RPC_PORT
 * @param {string} options.ISOLATED_ST_UNSERIALIZATION_MEMORY_LIMIT
 * @param {string} options.ISOLATED_ST_UNSERIALIZATION_TIMEOUT_MILLIS
 * @param {string} options.DATA_CONTRACT_LEVEL_DB_FILE
 * @param {string} options.DOCUMENTS_MONGODB_DB_PREFIX
 * @param {string} options.DOCUMENTS_MONGODB_URL
 * @param {string} options.CORE_JSON_RPC_HOST
 * @param {string} options.CORE_JSON_RPC_PORT
 * @param {string} options.CORE_JSON_RPC_USERNAME
 * @param {string} options.CORE_JSON_RPC_PASSWORD
 *
 * @return {AwilixContainer}
 */
async function createDIContainer(options) {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  /**
   * Register environment variables
   */
  container.register({
    abciHost: asValue(options.ABCI_HOST),
    abciPort: asValue(options.ABCI_PORT),
    blockchainStateLevelDBFile: asValue(options.BLOCKCHAIN_STATE_LEVEL_DB_FILE),
    dataContractCacheSize: asValue(options.DATA_CONTRACT_CACHE_SIZE),
    identityLevelDBFile: asValue(options.IDENTITY_LEVEL_DB_FILE),
    isolatedSTUnserializationMemoryLimit: asValue(
      parseInt(options.ISOLATED_ST_UNSERIALIZATION_MEMORY_LIMIT, 10),
    ),
    isolatedSTUnserializationTimeout: asValue(
      parseInt(options.ISOLATED_ST_UNSERIALIZATION_TIMEOUT_MILLIS, 10),
    ),
    dataContractLevelDBFile: asValue(options.DATA_CONTRACT_LEVEL_DB_FILE),
    documentsMongoDBPrefix: asValue(options.DOCUMENTS_MONGODB_DB_PREFIX),
    documentsMongoDBUrl: asValue(options.DOCUMENTS_MONGODB_URL),
    coreJsonRpcHost: asValue(options.CORE_JSON_RPC_HOST),
    coreJsonRpcPort: asValue(options.CORE_JSON_RPC_PORT),
    coreJsonRpcUsername: asValue(options.CORE_JSON_RPC_USERNAME),
    coreJsonRpcPassword: asValue(options.CORE_JSON_RPC_PASSWORD),
  });

  /**
   * Register common services
   */
  container.register({
    logger: asFunction(() => new Logger(console)).singleton(),

    noDataProviderDpp: asFunction(() => (
      new DashPlatformProtocol({ dataProvider: undefined })
    )).singleton(),

    coreRpcClient: asFunction((
      coreJsonRpcHost,
      coreJsonRpcPort,
      coreJsonRpcUsername,
      coreJsonRpcPassword,
    ) => (
      new RpcClient({
        protocol: 'http',
        host: coreJsonRpcHost,
        port: coreJsonRpcPort,
        user: coreJsonRpcUsername,
        pass: coreJsonRpcPassword,
      }))).singleton(),
  });

  /**
   * Register Identity
   */
  container.register({
    identityLevelDB: asFunction(identityLevelDBFile => (
      level(identityLevelDBFile, { valueEncoding: 'binary' })
    )).disposer(levelDB => levelDB.close())
      .singleton(),

    identityRepository: asClass(IdentityLevelDBRepository).singleton(),
    identitiesTransaction: asFunction(identityRepository => (
      identityRepository.createTransaction()
    )).singleton(),
  });

  /**
   * Register Data Contract
   */
  container.register({
    dataContractLevelDB: asFunction(dataContractLevelDBFile => (
      level(dataContractLevelDBFile, { valueEncoding: 'binary' })
    )).disposer(levelDB => levelDB.close())
      .singleton(),

    dataContractRepository: asClass(DataContractLevelDBRepository).singleton(),
    dataContractsTransaction: asFunction(dataContractRepository => (
      dataContractRepository.createTransaction()
    )).singleton(),

    dataContractsCache: asFunction(dataContractCacheSize => (
      new LRUCache(dataContractCacheSize)
    )).singleton(),
  });

  /**
   * Register Document
   */
  const mongoClient = await MongoClient.connect(
    options.DOCUMENTS_MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  );

  await checkReplicaSetInit(mongoClient);

  container.register({
    documentsMongoDBClient: asValue(mongoClient),

    findConflictingConditions: asValue(findConflictingConditions),
    getIndexedFieldsFromDocumentSchema: asValue(getIndexedFieldsFromDocumentSchema),
    findNotIndexedFields: asValue(findNotIndexedFields),
    findNotIndexedOrderByFields: asValue(findNotIndexedOrderByFields),
    convertWhereToMongoDbQuery: asValue(convertWhereToMongoDbQuery),
    validateQuery: asFunction(validateQueryFactory).singleton(),

    getDocumentsDatabase: asFunction(getDocumentsDatabaseFactory).singleton(),
    createDocumentRepository: asFunction(createDocumentMongoDbRepositoryFactory).singleton(),
    documentsTransaction: asFunction(documentsMongoDVClient => (
      new MongoDBTransaction(documentsMongoDVClient)
    )),

    fetchDocuments: asFunction(fetchDocumentsFactory).singleton(),
  });

  /**
   * Register blockchain state
   */
  container.register({
    blockchainStateLevelDB: asFunction(blockchainStateLevelDBFile => (
      level(blockchainStateLevelDBFile, { valueEncoding: 'binary' })
    )).disposer(levelDB => levelDB.close())
      .singleton(),

    blockchainStateRepository: asClass(BlockchainStateLevelDBRepository),
  });

  const blockchainStateRepository = container.resolve('blockchainStateRepository');
  const blockchainState = await blockchainStateRepository.fetch();

  container.register({
    blockchainState: asValue(blockchainState),
    blockExecutionDBTransactions: asClass(BlockExecutionDBTransactions).singleton(),
    blockExecutionState: asClass(BlockExecutionState).singleton(),
  });

  /**
   * Register DPP
   */
  const isolatedSnapshot = await createIsolatedValidatorSnapshot();

  container.register({
    isolatedSTUnserializationOptions: asFunction((
      isolatedSTUnserializationMemoryLimit,
      isolatedSTUnserializationTimeout,
    ) => ({
      memoryLimit: isolatedSTUnserializationMemoryLimit,
      timeout: isolatedSTUnserializationTimeout,
    })),

    isolatedJsonSchemaValidatorSnapshot: asValue(isolatedSnapshot),

    dataProvider: asFunction((
      identityRepository,
      dataContractRepository,
      fetchDocuments,
      coreRpcClient,
      dataContractCache,
    ) => {
      const dataProvider = new DriveDataProvider(
        identityRepository,
        dataContractRepository,
        fetchDocuments,
        coreRpcClient,
      );

      return new CachedDataProviderDecorator(dataProvider, dataContractCache);
    }),

    transactionalDataProvider: asFunction((
      identityRepository,
      dataContractRepository,
      fetchDocuments,
      coreRpcClient,
      blockExecutionDBTransactions,
      dataContractCache,
    ) => {
      const dataProvider = new DriveDataProvider(
        identityRepository,
        dataContractRepository,
        fetchDocuments,
        coreRpcClient,
        blockExecutionDBTransactions,
      );

      return new CachedDataProviderDecorator(dataProvider, dataContractCache);
    }),

    unserializeStateTransition: asFunction((
      isolatedJsonSchemaValidatorSnapshot,
      isolatedSTUnserializationOptions,
      dataProvider,
    ) => {
      const createIsolatedDpp = createIsolatedDppFactory(
        isolatedJsonSchemaValidatorSnapshot,
        isolatedSTUnserializationOptions,
        dataProvider,
      );

      return unserializeStateTransitionFactory(createIsolatedDpp);
    }),

    transactionalUnserializeStateTransition: asFunction((
      isolatedJsonSchemaValidatorSnapshot,
      isolatedSTUnserializationOptions,
      transactionalDataProvider,
    ) => {
      const createIsolatedDpp = createIsolatedDppFactory(
        isolatedJsonSchemaValidatorSnapshot,
        isolatedSTUnserializationOptions,
        transactionalDataProvider,
      );

      return unserializeStateTransitionFactory(createIsolatedDpp);
    }),

    transactionalDpp: asFunction(transactionalDataProvider => (
      new DashPlatformProtocol({ dataProvider: transactionalDataProvider })
    )),

    // dpp: asFunction(dataProvider => (
    //   new DashPlatformProtocol({ dataProvider })
    // )),
  });

  /**
   * Register ABCI handlers and dependencies
   */
  container.register({
    infoHandler: asFunction(infoHandlerFactory),
    checkTxHandler: asFunction(checkTxHandlerFactory),
    beginBlockHandler: asFunction(beginBlockHandlerFactory),
    deliverTxHandler: asFunction(deliverTxHandlerFactory),
    commitHandler: asFunction(commitHandlerFactory),
    queryHandler: asFunction(queryHandlerFactory),

    wrapInErrorHandler: asFunction(wrapInErrorHandlerFactory),

    abciHandlers: asFunction(({
      infoHandler,
      checkTxHandler,
      beginBlockHandler,
      deliverTxHandler,
      commitHandler,
      wrapInErrorHandler,
      queryHandler,
    }) => ({
      info: infoHandler,
      checkTx: wrapInErrorHandler(checkTxHandler),
      beginBlock: beginBlockHandler,
      deliverTx: wrapInErrorHandler(deliverTxHandler),
      commit: commitHandler,
      query: wrapInErrorHandler(queryHandler),
    })).proxy().singleton(),
  });

  return container;
}

module.exports = createDIContainer;
