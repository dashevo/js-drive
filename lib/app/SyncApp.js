const IpfsAPI = require('ipfs-api');
const RpcClient = require('@dashevo/dashd-rpc/promise');
const { MongoClient } = require('mongodb');

const SyncStateRepository = require('../sync/state/repository/SyncStateRepository');
const RpcBlockIterator = require('../blockchain/iterator/RpcBlockIterator');
const STIterator = require('../blockchain/iterator/STIterator');
const ReaderState = require('../blockchain/reader/BlockchainReaderState');
const STReader = require('../blockchain/reader/BlockchainReader');
const SyncEventBus = require('../blockchain/reader/BlockchainReaderMediator');
const sanitizeData = require('../mongoDb/sanitizeData');
const DapContractMongoDbRepository = require('../stateView/dapContract/DapContractMongoDbRepository');
const DapObjectMongoDbRepository = require('../stateView/dapObject/DapObjectMongoDbRepository');
const createDapObjectMongoDbRepositoryFactory = require('../stateView/dapObject/createDapObjectMongoDbRepositoryFactory');
const updateDapContractFactory = require('../stateView/dapContract/updateDapContractFactory');
const updateDapObjectFactory = require('../stateView/dapObject/updateDapObjectFactory');
const applyStateTransitionFactory = require('../stateView/applyStateTransitionFactory');
const handleBlockErrorsDecoratorFactory = require('../blockchain/reader/handleBlockErrorsDecoratorFactory');
const readChainFactory = require('../blockchain/reader/readBlockchainFactory');

const unpinAllIpfsPacketsFactory = require('../storage/ipfs/unpinAllIpfsPacketsFactory');
const dropMongoDatabasesWithPrefixFactory = require('../mongoDb/dropMongoDatabasesWithPrefixFactory');

const isDashCoreRunningFactory = require('../sync/isDashCoreRunningFactory');
const DashCoreIsNotRunningError = require('../sync/DashCoreIsNotRunningError');

class SyncApp {
  /**
   * @param {SyncAppOptions} options
   */
  constructor(options) {
    this.options = options;
    this.rpcClient = new RpcClient({
      protocol: 'http',
      host: this.options.getDashCoreJsonRpcHost(),
      port: this.options.getDashCoreJsonRpcPort(),
      user: this.options.getDashCoreJsonRpcUser(),
      pass: this.options.getDashCoreJsonRpcPass(),
    });
    this.ipfsAPI = new IpfsAPI(this.options.getStorageIpfsMultiAddr());
    this.mongoClient = null;
    this.syncStateRepository = null;
    this.syncState = null;
    this.stReader = null;
    this.syncEventBus = null;
  }

  /**
   * Init SyncApp
   *
   * @returns {Promise<void>}
   */
  async init() {
    const isDashCoreRunning = isDashCoreRunningFactory(this.rpcClient);

    const isRunning = await isDashCoreRunning(
      this.options.getDashCoreRunningCheckMaxRetries(),
      this.options.getDashCoreRunningCheckInterval(),
    );
    if (!isRunning) {
      throw new DashCoreIsNotRunningError();
    }

    this.mongoClient = await MongoClient.connect(
      this.options.getStorageMongoDbUrl(),
      { useNewUrlParser: true },
    );

    const mongoDb = this.mongoClient.db(this.options.getStorageMongoDbDatabase());
    this.syncStateRepository = new SyncStateRepository(mongoDb);
    this.syncState = await this.syncStateRepository.fetch();
  }

  /**
   * Get Mongo client
   *
   * @returns {MongoClient}
   */
  getMongoClient() {
    return this.mongoClient;
  }

  /**
   * Get RPC client
   *
   * @returns {RpcClient}
   */
  getRpcClient() {
    return this.rpcClient;
  }

  /**
   * Get syncStateRepository
   *
   * @returns {SyncStateRepository}
   */
  getSyncStateRepository() {
    return this.syncStateRepository;
  }

  /**
   * Get SyncState
   *
   * @returns {SyncState}
   */
  getSyncState() {
    return this.syncState;
  }

  /**
   * Get ipfsAPI
   *
   * @returns {IpfsAPI}
   */
  getIpfsApi() {
    return this.ipfsAPI;
  }

  /**
   * Create STHeadersReader
   *
   * @returns {STReader}
   */
  createSTReader() {
    if (this.stReader) {
      const blockIterator = new RpcBlockIterator(this.getRpcClient());

      const stIterator = new STIterator(
        blockIterator,
        this.getRpcClient(),
      );
      const stReaderState = new ReaderState(
        this.getSyncState().getBlocks(),
        this.options.getSyncStateBlocksLimit(),
      );

      this.stReader = new STReader(
        stIterator,
        stReaderState,
        this.createSyncEventBus(),
        this.options.getSyncEvoStartBlockHeight(),
      );
    }

    return this.stReader;
  }

  createSyncEventBus() {
    if (!this.syncEventBus) {
      this.syncEventBus = new SyncEventBus();
    }

    return this.syncEventBus;
  }

  /**
   * @return {sync}
   */
  createReadChain() {
    const options = {
      maxRetries: this.options.getSyncBlockRetries(),
      skipBlockWithErrors: this.options.getSyncBlockSkipWithErrors(),
    };

    const syncEventBus = this.createSyncEventBus();

    const stReaderWithErrorHandler = handleBlockErrorsDecoratorFactory(
      this.createSTReader(),
      syncEventBus,
      options,
    );

    return readChainFactory(
      stReaderWithErrorHandler,
      syncEventBus,
      this.getRpcClient(),
    );
  }

  /**
   * Create unpinAllIpfsPackets
   *
   * @returns {unpinAllIpfsPackets}
   */
  createUnpinAllIpfsPackets() {
    return unpinAllIpfsPacketsFactory(this.getIpfsApi());
  }

  /**
   * Create dropMonoDatabasesWithPrefix
   *
   * @returns {dropMongoDatabasesWithPrefix}
   */
  createDropMongoDatabasesWithPrefix() {
    return dropMongoDatabasesWithPrefixFactory(this.getMongoClient());
  }

  /**
   * Create applyStateTransition
   *
   * @returns {applyStateTransition}
   */
  createApplyStateTransition() {
    const mongoDb = this.getMongoClient().db(this.options.getStorageMongoDbDatabase());
    const dapContractMongoDbRepository = new DapContractMongoDbRepository(mongoDb, sanitizeData);
    const createDapObjectMongoDbRepository = createDapObjectMongoDbRepositoryFactory(
      this.getMongoClient(),
      DapObjectMongoDbRepository,
    );
    const updateDapContract = updateDapContractFactory(dapContractMongoDbRepository);
    const updateDapObject = updateDapObjectFactory(createDapObjectMongoDbRepository);
    return applyStateTransitionFactory(
      this.getIpfsApi(),
      updateDapContract,
      updateDapObject,
      this.options.getStorageIpfsTimeout() * 1000,
    );
  }
}

module.exports = SyncApp;
