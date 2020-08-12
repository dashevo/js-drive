const {
  abci: {
    ResponseInfo,
  },
} = require('abci/types');

const infoHandlerFactory = require('../../../../lib/abci/handlers/infoHandlerFactory');

const BlockchainState = require('../../../../lib/blockchainState/BlockchainState');

const packageJson = require('../../../../package');

describe('infoHandlerFactory', () => {
  let appVersion;
  let lastBlockHeight;
  let lastBlockAppHash;
  let infoHandler;

  beforeEach(() => {
    lastBlockHeight = 1;
    lastBlockAppHash = Buffer.alloc(0);
    appVersion = 1;

    const blockchainState = new BlockchainState(appVersion, lastBlockHeight, lastBlockAppHash);

    infoHandler = infoHandlerFactory(blockchainState);
  });

  it('should return ResponseInfo', async () => {
    const response = await infoHandler();

    expect(response).to.be.an.instanceOf(ResponseInfo);

    expect(response).to.deep.include({
      version: packageJson.version,
      appVersion,
      lastBlockHeight,
      lastBlockAppHash,
    });
  });
});
