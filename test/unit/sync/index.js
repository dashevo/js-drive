/* eslint-disable global-require */
describe('Sync', () => {
  require('./attachCleanDashDriveHandler');
  require('./cleanDashDriveFactory');
  require('./isSynced');
  require('./getCheckSyncHttpMiddleware');
  require('./state');
});
