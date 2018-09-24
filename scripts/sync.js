require('dotenv-expand')(require('dotenv-safe').config());

const zmq = require('zeromq');

const SyncAppOptions = require('../lib/app/SyncAppOptions');
const SyncApp = require('../lib/app/SyncApp');
const attachStorageHandlers = require('../lib/storage/attachStorageHandlers');
const attachSyncHandlers = require('../lib/sync/state/attachSyncHandlers');
const attachStateViewHandlers = require('../lib/stateView/attachStateViewHandlers');
const readChainFactory = require('../lib/blockchain/readChainFactory');
const errorHandler = require('../lib/util/errorHandler');

(async function main() {
  const syncAppOptions = new SyncAppOptions(process.env);
  const syncApplication = new SyncApp(syncAppOptions);
  await syncApplication.init();

  const stHeaderReader = syncApplication.createSTHeadersReader();
  const rpcClient = syncApplication.getRpcClient();
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

  const readChain = readChainFactory(stHeaderReader, rpcClient, syncState, cleanDashDrive);
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
