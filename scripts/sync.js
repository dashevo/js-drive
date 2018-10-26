require('dotenv-expand')(require('dotenv-safe').config());

const zmq = require('zeromq');

const SyncAppOptions = require('../lib/app/SyncAppOptions');
const SyncApp = require('../lib/app/SyncApp');

const attachStorageHandlers = require('../lib/storage/attachStorageHandlers');
const attachSyncHandlers = require('../lib/sync/state/attachSyncHandlers');
const attachStateViewHandlers = require('../lib/stateView/attachStateViewHandlers');

const throttleFactory = require('../lib/util/throttleFactory');
const errorHandler = require('../lib/util/errorHandler');

(async function main() {
  const syncAppOptions = new SyncAppOptions(process.env);
  const syncApp = new SyncApp(syncAppOptions);
  await syncApp.init();

  const stReader = syncApp.createSTReader();
  const syncEventBus = syncApp.createSyncEventBus();

  // Attach listeners to SyncEventBus
  attachStorageHandlers(
    syncEventBus,
    syncApp.getIpfsApi(),
    syncApp.getRpcClient(),
    syncApp.createUnpinAllIpfsPackets(),
    syncAppOptions.getStorageIpfsTimeout(),
  );

  attachSyncHandlers(
    syncEventBus,
    stReader,
    syncApp.getSyncState(),
    syncApp.getSyncStateRepository(),
  );

  attachStateViewHandlers(
    syncEventBus,
    syncApp.createApplyStateTransition(),
    syncApp.createDropMongoDatabasesWithPrefix(),
    syncAppOptions.getMongoDbPrefix(),
  );

  const sync = syncApp.createReadChain();
  const syncWithThrottling = throttleFactory(sync);

  // Sync arriving ST packets
  const zmqSocket = zmq.createSocket('sub');
  zmqSocket.connect(syncAppOptions.getDashCoreZmqPubHashBlock());

  zmqSocket.on('message', () => {
    syncWithThrottling().catch(errorHandler);
  });

  zmqSocket.subscribe('hashblock');

  await syncWithThrottling();
}()).catch(errorHandler);
