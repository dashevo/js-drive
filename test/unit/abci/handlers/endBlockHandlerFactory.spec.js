const {
  abci: {
    ResponseEndBlock,
  },
} = require('abci/types');

const endBlockHandlerFactory = require('../../../../lib/abci/handlers/endBlockHandlerFactory');

describe('endBlockHandlerFactory', () => {
  let endBlockHandler;
  let request;
  let latestCoreChainLock;

  beforeEach(function beforeEach() {
    latestCoreChainLock = 'ea480100f4a5708c82f589e19dfe9e9cd1dbab57f74f27b24f0a3c765ba6e007000000000a43f1c3e5b3e8dbd670bca8d437dc25572f72d8e1e9be673e9ebbb606570307c3e5f5d073f7beb209dd7e0b8f96c751060ab3a7fb69a71d5ccab697b8cfa5a91038a6fecf76b7a827d75d17f01496302942aa5e2c7f4a48246efc8d3941bf6c';

    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    endBlockHandler = endBlockHandlerFactory(
      null,
      loggerMock,
    );

    request = {
      latestCoreChainLock,
    };
  });

  it('should return ResponseEndBlock', async () => {
    const response = await endBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);
    expect(response.latestCoreChainLock).to.equal(latestCoreChainLock);
  });
});
