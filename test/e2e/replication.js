describe('Replication', function() {

  before('having two master nodes started in "regtest" mode', function() {
    // TODO: start master nodes here
  });

  describe('Dash Drive [Master Node #1]', function() {
    it('should receive data from Dash Core once submitted, save it and update status', function() {
      // TODO: get latest status

      // TODO: create data using Dash Core interface

      // TODO: wait for data to be received and saved

      // TODO: check latest status
    });
  });

  describe('Dash Drive [Master Node #2]', function() {
    it('should replicate data from Dash Drive of node #1', function() {
      // TODO: wait for data to be synced?

      // TODO: check data is same?
    });
  });

  after('cleanup', function() {
    // TODO: probably we should clean after test?
  });
});
