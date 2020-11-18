const waitForDmlActivatedFactory = require('../../../lib/core/waitForDmlActivatedFactory');

describe('waitForDmlActivatedFactory', function main() {
  this.timeout(20000);

  let waitForDmlActivated;
  let coreRpcClientMock;

  beforeEach(function beforeEach() {
    coreRpcClientMock = {
      getBlockCount: this.sinon.stub(),
    };

    coreRpcClientMock.getBlockCount.onCall(0).resolves({ result: 999 });
    coreRpcClientMock.getBlockCount.onCall(1).resolves({ result: 1000 });

    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
      trace: this.sinon.stub(),
      error: this.sinon.stub(),
    };

    waitForDmlActivated = waitForDmlActivatedFactory(
      coreRpcClientMock,
      loggerMock,
    );
  });

  it('should wait for 1000 height', async () => {
    await waitForDmlActivated();

    expect(coreRpcClientMock.getBlockCount).to.have.been.calledTwice();
  });
});
