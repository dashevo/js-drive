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
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}`,
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
