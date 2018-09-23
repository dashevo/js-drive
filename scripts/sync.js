require('dotenv-expand')(require('dotenv-safe').config());

const zmq = require('zeromq');
const IpfsAPI = require('ipfs-api');
const RpcClient = require('bitcoind-rpc-dash/promise');
const { MongoClient } = require('mongodb');

const SyncStateRepository = require('../lib/sync/state/repository/SyncStateRepository');
const RpcBlockIterator = require('../lib/blockchain/iterator/RpcBlockIterator');
const StateTransitionHeaderIterator = require('../lib/blockchain/iterator/StateTransitionHeaderIterator');
const STHeadersReaderState = require('../lib/blockchain/reader/STHeadersReaderState');
const STHeadersReader = require('../lib/blockchain/reader/STHeadersReader');
const sanitizeData = require('../lib/mongoDb/sanitizeData');
const DapContractMongoDbRepository = require('../lib/stateView/dapContract/DapContractMongoDbRepository');
const DapObjectMongoDbRepository = require('../lib/stateView/dapObject/DapObjectMongoDbRepository');
const createDapObjectMongoDbRepositoryFactory = require('../lib/stateView/dapObject/createDapObjectMongoDbRepositoryFactory');
const updateDapContractFactory = require('../lib/stateView/dapContract/updateDapContractFactory');
const updateDapObjectFactory = require('../lib/stateView/dapObject/updateDapObjectFactory');
const applyStateTransitionFactory = require('../lib/stateView/applyStateTransitionFactory');

const cleanDashDriveFactory = require('../lib/sync/cleanDashDriveFactory');
const unpinAllIpfsPacketsFactory = require('../lib/storage/ipfs/unpinAllIpfsPacketsFactory');
const dropMongoDatabasesWithPrefixFactory = require('../lib/mongoDb/dropMongoDatabasesWithPrefixFactory');

const attachStorageHandlers = require('../lib/storage/attachStorageHandlers');
const attachSyncHandlers = require('../lib/sync/state/attachSyncHandlers');
const attachStateViewHandlers = require('../lib/stateView/attachStateViewHandlers');
const errorHandler = require('../lib/util/errorHandler');

const isDashCoreRunningFactory = require('../lib/sync/isDashCoreRunningFactory');
const DashCoreIsNotRunningError = require('../lib/sync/DashCoreIsNotRunningError');

class SyncAppOptions {
  constructor(options) {
    this.dashCoreJsonRpcHost = options.DASHCORE_JSON_RPC_HOST;
    this.dashCoreJsonRpcPort = options.DASHCORE_JSON_RPC_PORT;
    this.dashCoreJsonRpcUser = options.DASHCORE_JSON_RPC_USER;
    this.dashCoreJsonRpcPass = options.DASHCORE_JSON_RPC_PASS;
    this.dashCoreRunningCheckMaxRetries = parseInt(options.DASHCORE_RUNNING_CHECK_MAX_RETRIES, 10);
    this.dashCoreRunningCheckInterval = parseInt(options.DASHCORE_RUNNING_CHECK_INTERVAL, 10);
    this.dashCoreZmqPubHashblock = options.DASHCORE_ZMQ_PUB_HASHBLOCK;
    this.storageIpfsMultiAddr = options.STORAGE_IPFS_MULTIADDR;
    this.storageMongoDbUrl = options.STORAGE_MONGODB_URL;
    this.storageMongoDbDatabase = options.STORAGE_MONGODB_DB;
    this.syncEvoStartBlockHeight = parseInt(options.SYNC_EVO_START_BLOCK_HEIGHT, 10);
    this.syncStateBlocksLimit = options.SYNC_STATE_BLOCKS_LIMIT;
    this.mongoDbPrefix = options.MONGODB_DB_PREFIX;
  }

  getDashCoreJsonRpcHost() {
    return this.dashCoreJsonRpcHost;
  }

  getDashCoreJsonRpcPort() {
    return this.dashCoreJsonRpcPort;
  }

  getDashCoreJsonRpcUser() {
    return this.dashCoreJsonRpcUser;
  }

  getDashCoreJsonRpcPass() {
    return this.dashCoreJsonRpcPass;
  }

  getDashCoreRunningCheckMaxRetries() {
    return this.dashCoreRunningCheckMaxRetries;
  }

  getDashCoreRunningCheckInterval() {
    return this.dashCoreRunningCheckInterval;
  }

  getDashCoreZmqPubHashBlock() {
    return this.dashCoreZmqPubHashblock;
  }

  getStorageIpfsMultiAddr() {
    return this.storageIpfsMultiAddr;
  }

  getStorageMongoDbUrl() {
    return this.storageMongoDbUrl;
  }

  getStorageMongoDbDatabase() {
    return this.storageMongoDbDatabase;
  }

  getSyncEvoStartBlockHeight() {
    return this.syncEvoStartBlockHeight;
  }

  getSyncStateBlocksLimit() {
    return this.syncStateBlocksLimit;
  }

  getMongoDbPrefix() {
    return this.mongoDbPrefix;
  }
}

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
  }

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

  getMongoClient() {
    return this.mongoClient;
  }

  getRpcClient() {
    return this.rpcClient;
  }

  getSyncStateRepository() {
    return this.syncStateRepository;
  }

  getSyncState() {
    return this.syncState;
  }

  getIpfsApi() {
    return this.ipfsAPI;
  }

  createSTHeadersReader() {
    const blockIterator = new RpcBlockIterator(
      this.getRpcClient(),
      this.options.getSyncEvoStartBlockHeight(),
    );
    const stHeaderIterator = new StateTransitionHeaderIterator(
      blockIterator,
      this.getRpcClient(),
    );
    const stHeadersReaderState = new STHeadersReaderState(
      this.getSyncState().getBlocks(),
      this.options.getSyncStateBlocksLimit(),
    );
    return new STHeadersReader(stHeaderIterator, stHeadersReaderState);
  }

  createUnpinAllIpfsPackets() {
    return unpinAllIpfsPacketsFactory(this.getIpfsApi());
  }

  createDropMongoDatabasesWithPrefix() {
    return dropMongoDatabasesWithPrefixFactory(this.getMongoClient());
  }

  createCleanDashDrive() {
    return cleanDashDriveFactory(
      this.createUnpinAllIpfsPackets(),
      this.createDropMongoDatabasesWithPrefix(),
      this.options.getMongoDbPrefix(),
    );
  }

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
    );
  }
}

function readChainFactory(stHeaderReader, syncState, cleanDashDrive) {
  let isInSync = false;
  async function readChain(sinceBlockHash) {
    try {
      if (isInSync) {
        return;
      }
      isInSync = true;

      // Start sync from the last synced block + 1
      stHeaderReader.stHeaderIterator.blockIterator.setBlockHeightFromSyncState(syncState);
      // Reset height to the current block's height
      await stHeaderReader.stHeaderIterator.blockIterator.resetFromCurrentBlockHeight(sinceBlockHash);

      stHeaderReader.stHeaderIterator.reset(false);

      await stHeaderReader.read();

      isInSync = false;
    } catch (error) {
      if (error.message === 'Block height out of range' && !syncState.isEmpty()) {
        await cleanDashDrive(process.env.MONGODB_DB_PREFIX);

        stHeaderReader.resetToBlockHeight(1);
        syncState.clean();

        isInSync = false;

        await readChain();

        return;
      }
      isInSync = false;
      throw error;
    }
  }
  return readChain;
}

(async function main() {
  const syncAppOptions = new SyncAppOptions(process.envs);
  const syncApplication = new SyncApp(syncAppOptions);
  await syncApplication.init();

  const stHeaderReader = syncApplication.createSTHeadersReader();
  const ipfsAPI = syncApplication.getIpfsApi();
  const unpinAllIpfsPackets = syncApplication.createUnpinAllIpfsPackets();
  const syncState = syncApplication.getSyncState();
  const syncStateRepository = syncApplication.getSyncStateRepository();
  const applyStateTransition = syncApplication.createApplyStateTransition();
  const dropMongoDatabasesWithPrefix = syncApplication.createDropMongoDatabasesWithPrefix();
  const cleanDashDrive = syncApplication.createCleanDashDrive();

  attachStorageHandlers(stHeaderReader, ipfsAPI, unpinAllIpfsPackets);
  attachSyncHandlers(stHeaderReader, syncState, syncStateRepository);
  attachStateViewHandlers(stHeaderReader, applyStateTransition, dropMongoDatabasesWithPrefix);

  const readChain = readChainFactory(stHeaderReader, syncState, cleanDashDrive);
  await readChain();

  // Sync arriving ST packets
  const zmqSocket = zmq.createSocket('sub');
  zmqSocket.connect(syncAppOptions.getDashCoreZmqPubHashBlock());

  zmqSocket.on('message', (topic, blockHash) => {
    const sinceBlockHash = blockHash.toString('hex');
    readChain(sinceBlockHash).catch(errorHandler);
  });

  zmqSocket.subscribe('hashblock');
}()).catch(errorHandler);
