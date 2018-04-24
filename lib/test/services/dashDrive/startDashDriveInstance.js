const MongoDbInstance = require('../mongoDb/MongoDbInstance');
const startIPFSInstance = require('../IPFS/startIPFSInstance');
const startDashCoreInstance = require('../dashCore/startDashCoreInstance');
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

  const ipfsAPIs = await startIPFSInstance.many(number);
  const dashCoreInstances = await startDashCoreInstance.many(number);

  for (let i = 0; i < number; i++) {
    const dashCoreInstance = dashCoreInstances[i];
    const ipfsAPI = ipfsAPIs[i];
    const { apiHost, apiPort } = ipfsAPI;
    const mongoDbInstance = new MongoDbInstance();
    await mongoDbInstance.start();

    const ENV = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCoreInstance.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCoreInstance.options.getMainPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `STORAGE_IPFS_MULTIADDR=/ip4/${apiHost}/tcp/${apiPort}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}`,
    ];
    const dashDriveInstance = new DashDriveInstance({
      ENV,
    });
    await dashDriveInstance.start();

    const instance = {
      ipfs: ipfsAPI,
      dashCore: dashCoreInstance,
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
