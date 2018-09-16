/* eslint-disable global-require */
describe('Sync', () => {
  require('./cleanDashDriveFactory');
  require('./isDashCoreRunningFactory');
  require('./isSynced');
  require('./getCheckSyncHttpMiddleware');
  require('./getDriveStatusFactory');
  require('./getSyncInfoFactory');
  require('./state');
  require('./SyncInfo');
});
