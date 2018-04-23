describe('Blockchain reorganization', function() {

  before('having started first master node, generated STs and second master node synced with the first one', function() {
    // TODO: start master node #1 and #2

    // TODO: generate some blocks

    // TODO: wait until Dash Drive saves data on master node #1

    // TODO: wait until Dash Drive on master node #2 syncs data
  });

  describe('Dash Drive [Master Node #1]', function() {
    it('should sync data after blockchain reorganization, removing uncessary data', function() {
      // TODO: get block hash at some height and invalidate it

      // TODO: generate more blocks

      // TODO: wait until data is synced and old data removed
    });
  });

  describe('Dash Drive [Master Node #2]', function() {
    it('should sync data with Dash Drive of node #1', function() {
      // TODO: wait until data is synced with the first node
    });
  });
});
