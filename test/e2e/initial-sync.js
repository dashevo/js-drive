describe('Initial sync', function() {

  before('having master node #1 up and ready, some amount of blocks generated and Dash Drive on node #1 fully synced', function() {
    // TODO: start master node #1

    // TODO: generate blocks

    // TODO: wait until Dash Drive syncs
  });

  before('having master node #2 up and running with Dash Core but without Dash Drive', function() {
    // TODO: start master node #2 only with Dash Core

    // TODO: wait until Dash Core syncs
  });

  before('having started Dash Drive on node #2', function() {
    // TODO: start Dash Drive on node #2
  });

  describe('Dash Drive [Master Node 2]', function() {
    it('should sync the data with Dash Core on node #2', function() {
      // TODO: wait for Dash Drive to sync data

      // TODO: check if data is correct
    });
  });

  after('cleanup', function() {
    // TODO: probably we should clean after test?
  });
});
