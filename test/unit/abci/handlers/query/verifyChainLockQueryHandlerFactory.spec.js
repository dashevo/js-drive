const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const verifyChainLockQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/verifyChainLockQueryHandlerFactory');

const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');

const AbciError = require('../../../../../lib/abci/errors/AbciError');

describe('verifyChainLockQueryHandlerFactory', () => {
  let simplifiedMasternodeListMock;
  let verifyChainLockQueryHandler;
  let params;
  let decodeChainLockMock;
  let encodedChainLock;

  beforeEach(function beforeEach() {
    decodeChainLockMock = this.sinon.stub();

    params = {};

    simplifiedMasternodeListMock = {
      getStore: this.sinon.stub(),
    };

    encodedChainLock = Buffer.alloc(0);
  });

  it('should validate a valid chainlock', async function it() {
    decodeChainLockMock.returns({
      verify: this.sinon.stub().returns(true),
    });

    verifyChainLockQueryHandler = verifyChainLockQueryHandlerFactory(
      simplifiedMasternodeListMock, decodeChainLockMock,
    );

    const result = await verifyChainLockQueryHandler(params, { chainLock: encodedChainLock });

    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.code).to.equal(0);

    expect(decodeChainLockMock).to.be.calledOnceWithExactly(encodedChainLock);
  });

  it('should throw InvalidArgumentAbciError if chainlock is not valid', async function it() {
    decodeChainLockMock.returns({
      verify: this.sinon.stub().returns(false),
      toJSON: this.sinon.stub(),
    });

    verifyChainLockQueryHandler = verifyChainLockQueryHandlerFactory(
      simplifiedMasternodeListMock, decodeChainLockMock,
    );

    try {
      await verifyChainLockQueryHandler(params, { chainLock: encodedChainLock });

      expect.fail('should throw InvalidArgumentAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.message).to.equal('Signature invalid for chainlock');
    }
  });
});
