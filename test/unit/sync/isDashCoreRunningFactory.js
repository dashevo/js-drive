const isDashCoreRunningFactory = require('../../../lib/sync/isDashCoreRunningFactory');

describe('isDashCoreRunningFactory', () => {
  let isDashCoreRunning;
  let rpcClient;
  beforeEach(function beforeEach() {
    rpcClient = { ping: this.sinon.stub() };
    isDashCoreRunning = isDashCoreRunningFactory(rpcClient);
  });

  it('should return false and retry 2 times if DashCore is not running', async () => {
    rpcClient.ping.throws(new Error());

    const retries = 2;
    const retryDelay = 0.1;
    const isRunning = await isDashCoreRunning(retries, retryDelay);

    expect(isRunning).to.be.false();
    expect(rpcClient.ping).to.be.calledTwice();
  });

  it('should return true if DashCore is not running', async () => {
    const retries = 2;
    const retryDelay = 0.1;
    const isRunning = await isDashCoreRunning(retries, retryDelay);

    expect(isRunning).to.be.true();
    expect(rpcClient.ping).to.be.calledOnce();
  });
});
