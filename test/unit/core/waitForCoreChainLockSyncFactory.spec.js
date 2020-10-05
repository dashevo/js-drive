const LatestCoreChainLock = require('../../../lib/core/LatestCoreChainLock');
const waitForCoreChainLockSyncFactory = require('../../../lib/core/waitForCoreChainLockSyncFactory');

describe('waitForCoreChainLockSyncFactory', () => {
  let waitForCoreChainLockHandler;
  let latestCoreChainLock;
  let loggerMock;
  let coreRpcClientMock;
  let coreZMQClientMock;
  beforeEach(() => {
    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };
    coreRpcClientMock = {
      getBestChainLock: this.sinon.stub(),
    };
    coreZMQClientMock = {
      connect: this.sinon.stub(),
      subscribe: this.sinon.stub(),
    };
    latestCoreChainLock = new LatestCoreChainLock(this.sinon);
    waitForCoreChainLockHandler = waitForCoreChainLockSyncFactory(
      coreZMQClientMock,
      coreRpcClientMock,
      latestCoreChainLock,
      loggerMock,
    );
  });

  it('should wait for chainlock to be synced', async () => {
    const response = await waitForCoreChainLockHandler();

    console.log({response});
    // expect(response).to.be.an.instanceOf(ResponseBeginBlock);
    //
    // expect(blockchainState.getLastBlockHeight()).to.equal(blockHeight);
    // expect(blockExecutionDBTransactionsMock.start).to.be.calledOnce();
    // expect(blockExecutionStateMock.reset).to.be.calledOnce();
    // expect(blockExecutionStateMock.setHeader).to.be.calledOnceWithExactly(header);
  });
});
