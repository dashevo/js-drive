const {
  tendermint:{
    abci: {
      ResponseInitChain,
    },
  }
} = require('@dashevo/abci/types');

const initChainHandlerFactory = require('../../../../lib/abci/handlers/initChainHandlerFactory');

describe('initChainHandlerFactory', () => {
  let initChainHandler;

  beforeEach(function beforeEach() {
    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    initChainHandler = initChainHandlerFactory(
      loggerMock,
    );
  });

  it('should update height, start transactions return ResponseBeginBlock', async () => {
    const response = await initChainHandler();

    expect(response).to.be.an.instanceOf(ResponseInitChain);
  });
});
