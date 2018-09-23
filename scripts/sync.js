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

class SyncApplication {
  constructor() {
    this.rpcClient = new RpcClient({
      protocol: 'http',
      host: process.env.DASHCORE_JSON_RPC_HOST,
      port: process.env.DASHCORE_JSON_RPC_PORT,
      user: process.env.DASHCORE_JSON_RPC_USER,
      pass: process.env.DASHCORE_JSON_RPC_PASS,
    });
    this.ipfsAPI = new IpfsAPI(process.env.STORAGE_IPFS_MULTIADDR);
    this.mongoClient = null;
    this.syncStateRepository = null;
    this.syncState = null;
  }

  async init() {
    const isDashCoreRunning = isDashCoreRunningFactory(this.rpcClient);

    const isRunning = await isDashCoreRunning(
      parseInt(process.env.DASHCORE_RUNNING_CHECK_MAX_RETRIES, 10),
      parseInt(process.env.DASHCORE_RUNNING_CHECK_INTERVAL, 10),
    );
    if (!isRunning) {
      throw new DashCoreIsNotRunningError();
    }

    this.mongoClient = await MongoClient.connect(
      process.env.STORAGE_MONGODB_URL,
      { useNewUrlParser: true },
    );

    const mongoDb = this.mongoClient.db(process.env.STORAGE_MONGODB_DB);
    this.syncStateRepository = new SyncStateRepository(mongoDb);
    this.syncState = await this.syncStateRepository.fetch();

    this.isInitialized = true;
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
      parseInt(process.env.SYNC_EVO_START_BLOCK_HEIGHT, 10),
    );
    const stHeaderIterator = new StateTransitionHeaderIterator(
      blockIterator,
      this.getRpcClient(),
    );
    const stHeadersReaderState = new STHeadersReaderState(
      this.getSyncState().getBlocks(),
      process.env.SYNC_STATE_BLOCKS_LIMIT,
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
      process.env.MONGODB_DB_PREFIX,
    );
  }

  createApplyStateTransition() {
    const mongoDb = this.getMongoClient().db(process.env.STORAGE_MONGODB_DB);
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

function runSyncFactory(stHeaderReader, syncState, cleanDashDrive) {
  let isInSync = false;
  async function runSync(sinceBlockHash) {
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

        stHeaderReader.state.clear();
        stHeaderReader.stHeaderIterator.reset(false);
        stHeaderReader.stHeaderIterator.blockIterator.setBlockHeight(1);

        syncState.setBlocks([]);
        syncState.setLastSyncAt(null);
        syncState.setLastInitialSyncAt(null);

        isInSync = false;

        await runSync();

        return;
      }
      isInSync = false;
      throw error;
    }
  }
  return runSync;
}

(async function main() {
  const syncApplication = new SyncApplication();
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

  const runSync = runSyncFactory(stHeaderReader, syncState, cleanDashDrive);
  await runSync();

  // Sync arriving ST packets
  const zmqSocket = zmq.createSocket('sub');
  zmqSocket.connect(process.env.DASHCORE_ZMQ_PUB_HASHBLOCK);

  zmqSocket.on('message', (topic, blockHash) => {
    const sinceBlockHash = blockHash.toString('hex');
    runSync(sinceBlockHash).catch(errorHandler);
  });

  zmqSocket.subscribe('hashblock');
}()).catch(errorHandler);
