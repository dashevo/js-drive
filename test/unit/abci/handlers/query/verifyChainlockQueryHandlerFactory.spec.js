const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const { ChainLock } = require('@dashevo/dashcore-lib');
const verifyChainlockQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/verifyChainlockQueryHandlerFactory');
const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

const chainlockJSON = {
  height: 394216,
  blockHash: '000008cc02119a783921e214f358c72eb42941d1f972e0111da5037f5007270b',
  signature: '061476c699fee312a29c0e7a604a5288237073e9317ac458f5772e0e40793fcca83ba72fe3b8f42f4cf1499c02764fb313b6661e873b084bb8e65cd087567060743fca85a73782a6f53503d4c336cc07b69780c6b9e98a4bfcce0d4b17d3d889',
};

const chainlockJSONinvalid = {
  height: 394216,
  blockHash: '000008cc02119a783921e214f358c72eb42941d1f972e0111da5037f5007270b',
  signature: '071476c699fee312a29c0e7a604a5288237073e9317ac458f5772e0e40793fcca83ba72fe3b8f42f4cf1499c02764fb313b6661e873b084bb8e65cd087567060743fca85a73782a6f53503d4c336cc07b69780c6b9e98a4bfcce0d4b17d3d889',
};

describe('verifyChainlockQueryHandlerFactory', () => {
  let simplifiedMasternodeListMock;
  let decodeChainLockMockValid;
  let decodeChainLockMockInvalid;
  let verifyChainlockQueryHandler;
  let chainlock;
  let chainlockInvalid;
  let params;
  let chainlockDataValid;
  let chainlockDataInvalid;

  beforeEach(function beforeEach() {
    chainlock = new ChainLock(chainlockJSON);
    chainlockInvalid = new ChainLock(chainlockJSONinvalid);
    params = {};
    chainlockDataValid = {
      chainLock: chainlock.toBuffer(),
      verify: this.sinon.stub().returns(true),
    };
    chainlockDataInvalid = {
      chainLock: chainlockInvalid.toBuffer(),
      verify: this.sinon.stub().returns(false),
    };
    decodeChainLockMockValid = this.sinon.stub().returns(chainlockDataValid);
    decodeChainLockMockInvalid = this.sinon.stub().returns(chainlockDataInvalid);
    simplifiedMasternodeListMock = {
      getStore: this.sinon.stub(),
    };
  });

  it('should validate a valid chainlock', async () => {
    verifyChainlockQueryHandler = verifyChainlockQueryHandlerFactory(
      simplifiedMasternodeListMock, decodeChainLockMockValid,
    );
    const result = await verifyChainlockQueryHandler(params, chainlockDataValid);

    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.code).to.equal(0);
  });

  it('should throw InvalidArgumentAbciError if chainlock is not valid', async () => {
    verifyChainlockQueryHandler = verifyChainlockQueryHandlerFactory(
      simplifiedMasternodeListMock, decodeChainLockMockInvalid,
    );
    try {
      await verifyChainlockQueryHandler(params, chainlockDataInvalid);
      expect.fail('should throw InvalidArgumentAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
