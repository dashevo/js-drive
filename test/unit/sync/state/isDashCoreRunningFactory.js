const isDashCoreRunningFactory = require('../../../../lib/sync/isDashCoreRunningFactory');

describe('isDashCoreRunningFactory', () => {
  let isDashCoreRunning;
  let rpcClient;
  beforeEach(function beforeEach() {
    rpcClient = { ping: this.sinon.stub() };
    isDashCoreRunning = isDashCoreRunningFactory(rpcClient);
  });

  it('should return false and retry 2 times if DashCore is not running', async () => {
    rpcClient.ping.throws(new Error());

    const isRunning = await isDashCoreRunning({
      retries: 2,
      retryDelay: 50,
    });

    expect(isRunning).to.be.false();
    expect(rpcClient.ping).to.be.calledTwice();
  });

  it('should return true if DashCore is not running', async () => {
    const isRunning = await isDashCoreRunning({
      retries: 2,
      retryDelay: 50,
    });

    expect(isRunning).to.be.true();
    expect(rpcClient.ping).to.be.calledOnce();
  });
});
