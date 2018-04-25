describe('Blockchain reorganization', () => {
  before('having started first master node, generated STs and second master node synced with the first one', () => {
    // TODO: start master node #1 and #2

    // TODO: generate some blocks

    // TODO: wait until Dash Drive saves data on master node #1

    // TODO: wait until Dash Drive on master node #2 syncs data
  });

  it('Dash Drive should sync data after blockchain reorganization, removing uncessary data.' +
     'Dash Drive on another node should sync with Dash Drive on the first node.', () => {
    // TODO: get block hash at some height and invalidate it

    // TODO: generate more blocks

    // TODO: wait until data is synced

    // TODO: check old data has been removed

    // TODO: wait until data is synced with the first node

    // TODO: check data match one on the first node
  });
});
