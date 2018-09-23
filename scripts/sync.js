require('dotenv-expand')(require('dotenv-safe').config());

const zmq = require('zeromq');

const SyncApp = require('../lib/app/SyncApp');
const attachStorageHandlers = require('../lib/storage/attachStorageHandlers');
const attachSyncHandlers = require('../lib/sync/state/attachSyncHandlers');
const attachStateViewHandlers = require('../lib/stateView/attachStateViewHandlers');
const readChainFactory = require('../lib/blockchain/readChainFactory');
const errorHandler = require('../lib/util/errorHandler');

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

(async function main() {
  const syncAppOptions = new SyncAppOptions(process.env);
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
