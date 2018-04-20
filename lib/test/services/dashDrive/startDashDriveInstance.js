const MongoDbInstance = require('../mongoDb/MongoDbInstance');
const DashDriveInstance = require('./DashDriveInstance');

async function startDashDriveInstance() {
  const instances = await startDashDriveInstance.many(1);
  return instances[0];
}

startDashDriveInstance.many = async function many(number) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  for (let i = 0; i < number; i++) {
    const mongoDbInstance = new MongoDbInstance();
    await mongoDbInstance.start();

    const ENV = [
      'API_RPC_PORT=6000',
      'API_RPC_HOST=0.0.0.0',
      'STORAGE_IPFS_MULTIADDR=/ip4/127.0.0.1/tcp/5001',
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}`,
      'STORAGE_MONGODB_DB=storage',
      'DASHCORE_ZMQ_PUB_HASHBLOCK=tcp://127.0.0.1:28332',
      'DASHCORE_JSON_RPC_HOST=127.0.0.1',
      'DASHCORE_JSON_RPC_PORT=9998',
      'DASHCORE_JSON_RPC_USER=dashrpc',
      'DASHCORE_JSON_RPC_PASS=password',
      'SYNC_EVO_START_BLOCK_HEIGHT=1',
      'SYNC_STATE_BLOCKS_LIMIT=12',
      'SYNC_STATE_CHECK_INTERVAL=10',
      'SYNC_CHAIN_CHECK_INTERVAL=5',
    ];
    const dashDriveInstance = new DashDriveInstance({
      ENV,
    });
    await dashDriveInstance.start();

    const instance = {
      mongoDb: mongoDbInstance,
      dashDrive: dashDriveInstance,
    };

    instances.push(instance);
  }

  after(async function after() {
    this.timeout(40000);
    const promises = instances.map(instance => Promise.all([
      instance.mongoDb.clean(),
      instance.dashDrive.clean(),
    ]));
    await Promise.all(promises);
  });

  return instances;
};

module.exports = startDashDriveInstance;
