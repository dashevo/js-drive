/* eslint-disable global-require */
describe('Sync', () => {
  require('./cleanDashDriveFactory');
  require('./isDashCoreRunningFactory');
  require('./isSynced');
  require('./getCheckSyncHttpMiddleware');
  require('./getDriveStatusFactory');
  require('./getSyncStatusFactory');
  require('./state');
  require('./SyncStatus');
});
