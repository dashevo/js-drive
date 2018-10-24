require('dotenv-expand')(require('dotenv-safe').config());

const zmq = require('zeromq');

const SyncAppOptions = require('../lib/app/SyncAppOptions');
const SyncApp = require('../lib/app/SyncApp');
const attachStorageHandlers = require('../lib/storage/attachStorageHandlers');
const attachSyncHandlers = require('../lib/sync/state/attachSyncHandlers');
const attachStateViewHandlers = require('../lib/stateView/attachStateViewHandlers');
const readChainFactory = require('../lib/blockchain/reader/readChainFactory');
const readChainWithThrottlingFactory = require('../lib/blockchain/reader/readChainWithThrottlingFactory');
const errorHandler = require('../lib/util/errorHandler');

(async function main() {
  const syncAppOptions = new SyncAppOptions(process.env);
  const syncApp = new SyncApp(syncAppOptions);
  await syncApp.init();

  const stHeaderReader = syncApp.createSTHeadersReader();
  const rpcClient = syncApp.getRpcClient();
  const ipfsAPI = syncApp.getIpfsApi();
  const unpinAllIpfsPackets = syncApp.createUnpinAllIpfsPackets();
  const syncState = syncApp.getSyncState();
  const syncStateRepository = syncApp.getSyncStateRepository();
  const applyStateTransition = syncApp.createApplyStateTransition();
  const dropMongoDatabasesWithPrefix = syncApp.createDropMongoDatabasesWithPrefix();

  // Attach listeners to ST Header Reader
  attachStorageHandlers(
    stHeaderReader,
    ipfsAPI,
    unpinAllIpfsPackets,
    syncAppOptions.getStorageIpfsTimeout(),
  );

  attachSyncHandlers(
    stHeaderReader,
    syncState,
    syncStateRepository,
  );

  attachStateViewHandlers(
    stHeaderReader,
    applyStateTransition,
    dropMongoDatabasesWithPrefix,
  );

  const readChain = readChainFactory(stHeaderReader, rpcClient);
  const readChainWithThrottling = readChainWithThrottlingFactory(readChain);

  // Sync arriving ST packets
  const zmqSocket = zmq.createSocket('sub');
  zmqSocket.connect(syncAppOptions.getDashCoreZmqPubHashBlock());

  zmqSocket.on('message', () => {
    readChainWithThrottling().catch(errorHandler);
  });

  zmqSocket.subscribe('hashblock');

  await readChainWithThrottling();
}()).catch(errorHandler);
