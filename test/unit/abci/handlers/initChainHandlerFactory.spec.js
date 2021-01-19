const {
  tendermint: {
    abci: {
      ResponseInitChain,
    },
  },
} = require('@dashevo/abci/types');

const initChainHandlerFactory = require('../../../../lib/abci/handlers/initChainHandlerFactory');
const LoggerMock = require('../../../../lib/test/mock/LoggerMock');

describe('initChainHandlerFactory', () => {
  let initChainHandler;
  let updateSimplifiedMasternodeListMock;
  let initialCoreChainLockedHeight;

  beforeEach(function beforeEach() {
    initialCoreChainLockedHeight = 1;

    updateSimplifiedMasternodeListMock = this.sinon.stub();

    const loggerMock = new LoggerMock(this.sinon);

    initChainHandler = initChainHandlerFactory(
      updateSimplifiedMasternodeListMock,
      initialCoreChainLockedHeight,
      loggerMock,
    );
  });

  it('should update height, start transactions return ResponseBeginBlock', async () => {
    const response = await initChainHandler();

    expect(updateSimplifiedMasternodeListMock).to.be.calledOnceWithExactly(
      initialCoreChainLockedHeight,
    );
    expect(response).to.be.an.instanceOf(ResponseInitChain);
  });
});
