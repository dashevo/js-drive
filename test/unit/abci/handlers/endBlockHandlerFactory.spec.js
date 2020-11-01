const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

const generateRandomIdentifier = require('@dashevo/dpp/lib/test/utils/generateRandomIdentifier');

const endBlockHandlerFactory = require('../../../../lib/abci/handlers/endBlockHandlerFactory');

const BlockExecutionContextMock = require('../../../../lib/test/mock/BlockExecutionContextMock');

const NoDPNSContractFoundError = require('../../../../lib/abci/handlers/errors/NoDPNSContractFoundError');

describe('endBlockHandlerFactory', () => {
  let endBlockHandler;
  let request;
  let blockExecutionContextMock;
  let header;
  let dpnsContractId;
  let dpnsContractBlockHeight;
  let blockHeight;
  let loggerMock;

  beforeEach(function beforeEach() {
    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);

    loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    dpnsContractId = generateRandomIdentifier();
    dpnsContractBlockHeight = blockHeight;

    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      loggerMock,
    );

    blockHeight = 2;

    header = {
      version: {
        App: 1,
      },
      height: blockHeight,
      time: {
        seconds: Math.ceil(new Date().getTime() / 1000),
      },
    };

    request = {
      header,
    };
  });

  it('should simply return a response if DPNS contract was not set', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      loggerMock,
    );

    const response = await endBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(blockExecutionContextMock.hasDataContract).to.not.have.been.called();
  });

  it('should return a response if DPNS contract is present at specified height', async () => {
    blockExecutionContextMock.hasDataContract.returns(true);

    const response = await endBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
      dpnsContractId,
    );
  });

  it('should throw and error if DPNS contract is not present at specified height', async () => {
    blockExecutionContextMock.hasDataContract.returns(false);

    try {
      await endBlockHandler(request);

      expect.fail('Error was not thrown');
    } catch (e) {
      expect(e).to.be.an.instanceOf(NoDPNSContractFoundError);
      expect(e.getContractId()).to.equal(dpnsContractId);
      expect(e.getHeight()).to.equal(blockHeight);

      expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
        dpnsContractId,
      );
    }
  });
});
