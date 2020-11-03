const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const { ChainLock } = require('@dashevo/dashcore-lib');
const SimplifiedMasternodeListFixtures = require('@dashevo/dashcore-lib/test/fixtures/mnList');
const SimplifiedMasternodeList = require('../../../../../lib/core/SimplifiedMasternodeList');
const verifyChainlockQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/verifyChainlockQueryHandlerFactory');

const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

const chainlockJSON = {
  height: 394216,
  blockHash: '000008cc02119a783921e214f358c72eb42941d1f972e0111da5037f5007270b',
  signature: '061476c699fee312a29c0e7a604a5288237073e9317ac458f5772e0e40793fcca83ba72fe3b8f42f4cf1499c02764fb313b6661e873b084bb8e65cd087567060743fca85a73782a6f53503d4c336cc07b69780c6b9e98a4bfcce0d4b17d3d889'
};

const chainlockJSONinvalid = {
  height: 394216,
  blockHash: '000008cc02119a783921e214f358c72eb42941d1f972e0111da5037f5007270b',
  signature: '071476c699fee312a29c0e7a604a5288237073e9317ac458f5772e0e40793fcca83ba72fe3b8f42f4cf1499c02764fb313b6661e873b084bb8e65cd087567060743fca85a73782a6f53503d4c336cc07b69780c6b9e98a4bfcce0d4b17d3d889'
};

describe('identityQueryHandlerFactory', () => {
  let smlDiffs;
  let simplifiedMasternodeList;
  let verifyChainlockQueryHandler;
  let chainlock;
  let chainlockInvalid;
  let params;
  let data;
  let dataInvalid;

  beforeEach(function beforeEach() {
    smlDiffs = SimplifiedMasternodeListFixtures.getChainlockDiffArray();
    simplifiedMasternodeList = new SimplifiedMasternodeList();
    simplifiedMasternodeList.applyDiffs(smlDiffs);
    verifyChainlockQueryHandler = verifyChainlockQueryHandlerFactory(
      simplifiedMasternodeList,
    );

    chainlock = new ChainLock(chainlockJSON);
    chainlockInvalid = new ChainLock(chainlockJSONinvalid);
    params = {};
    data = {
      chainLock: chainlock.toBuffer(),
    };
    dataInvalid = {
      chainLock: chainlockInvalid.toBuffer(),
    };
  });

  it('should validate a valid chainlock', async () => {
    const result = await verifyChainlockQueryHandler(params, data);

    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.code).to.equal(0);
  });

  it('should throw InvalidArgumentAbciError if chainlock is not valid', async () => {
    try {
      await verifyChainlockQueryHandler(params, dataInvalid);

      expect.fail('should throw InvalidArgumentAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.message).to.equal(`Signature invalid for chainlock
         ${chainlock}`,
        );
    }
  });
});
