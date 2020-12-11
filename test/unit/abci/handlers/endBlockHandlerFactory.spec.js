const {
  tendermint: {
    abci: {
      ResponseEndBlock,
    },
  },
} = require('@dashevo/abci/types');

const generateRandomIdentifier = require('@dashevo/dpp/lib/test/utils/generateRandomIdentifier');

const endBlockHandlerFactory = require('../../../../lib/abci/handlers/endBlockHandlerFactory');

const BlockExecutionContextMock = require('../../../../lib/test/mock/BlockExecutionContextMock');

const NoDPNSContractFoundError = require('../../../../lib/abci/handlers/errors/NoDPNSContractFoundError');

describe('endBlockHandlerFactory', () => {
  let endBlockHandler;
  let request;
  let blockExecutionContextMock;
  let dpnsContractId;
  let dpnsContractBlockHeight;
  let latestCoreChainLock;
  let loggerMock;

  beforeEach(function beforeEach() {
    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);
    latestCoreChainLock = 'ea480100f4a5708c82f589e19dfe9e9cd1dbab57f74f27b24f0a3c765ba6e007000000000a43f1c3e5b3e8dbd670bca8d437dc25572f72d8e1e9be673e9ebbb606570307c3e5f5d073f7beb209dd7e0b8f96c751060ab3a7fb69a71d5ccab697b8cfa5a91038a6fecf76b7a827d75d17f01496302942aa5e2c7f4a48246efc8d3941bf6c';

    loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    dpnsContractId = generateRandomIdentifier();
    dpnsContractBlockHeight = 2;

    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      latestCoreChainLock,
      loggerMock,
    );

    request = {
      header: {
        height: dpnsContractBlockHeight,
      },
    };
  });

  it('should simply return a response if DPNS contract was not set', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      latestCoreChainLock,
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
      expect(e.getHeight()).to.equal(dpnsContractBlockHeight);

      expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
        dpnsContractId,
      );
    }
  });
});
