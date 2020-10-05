const LatestCoreChainLock = require('../../../lib/core/LatestCoreChainLock');
const waitForCoreChainLockSyncFactory = require('../../../lib/core/waitForCoreChainLockSyncFactory');

describe('waitForCoreChainLockSyncFactory', () => {
  let waitForCoreChainLockHandler;
  let latestCoreChainLock;
  let coreRpcClientMock;
  let coreZMQClientMock;

  beforeEach(function beforeEach() {
    latestCoreChainLock = new LatestCoreChainLock(this.sinon);
    coreRpcClientMock = {
      getBestChainLock: this.sinon.stub(),
      getBlock: this.sinon.stub(),
    };
    coreZMQClientMock = {
      connect: this.sinon.stub(),
      subscribe: this.sinon.stub(),
      on: this.sinon.stub(),
      emit: this.sinon.stub(),
    };
    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };
    waitForCoreChainLockHandler = waitForCoreChainLockSyncFactory(
      coreZMQClientMock,
      coreRpcClientMock,
      latestCoreChainLock,
      loggerMock,
    );
  });

  it('should wait for chainlock to be synced', async () => {
    const response = await waitForCoreChainLockHandler();
    expect(response.latestCoreChainLock).to.be.an.instanceOf(LatestCoreChainLock);
  });
});
