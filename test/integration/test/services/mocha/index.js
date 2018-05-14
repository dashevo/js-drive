/* eslint-disable global-require */
describe('mocha', () => {
  require('./startDashCoreInstance');
  require('./startDashDriveInstance');
  require('./startIPFSInstance');
  require('./startMongoDbInstance');
});
