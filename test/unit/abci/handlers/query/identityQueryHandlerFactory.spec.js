const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');
const identityQueryHandlerFactory = require('../../../../../lib/abci/handlers/query/identityQueryHandlerFactory');

const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

describe('identityQueryHandlerFactory', () => {
  let identityQueryHandler;
  let identityRepositoryMock;

  beforeEach(function beforeEach() {
    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    identityQueryHandler = identityQueryHandlerFactory(
      identityRepositoryMock,
    );
  });

  it('should return serialized identity', async function it() {
    const id = 'id';
    const resultValue = Buffer.from('resultValue');

    identityRepositoryMock.fetch.resolves({
      serialize: this.sinon.stub().returns(resultValue),
    });

    const result = await identityQueryHandler({ id });

    expect(identityRepositoryMock.fetch).to.be.calledOnceWith(id);
    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.value).to.deep.equal(resultValue);
  });

  it('should throw InvalidArgumentAbciError if identity not found', async () => {
    const id = 'id';

    try {
      await identityQueryHandler({ id });

      expect.fail('should throw InvalidArgumentAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(InvalidArgumentAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.message).to.equal('Identity with specified ID is not found');
      expect(identityRepositoryMock.fetch).to.be.calledOnceWith(id);
    }
  });
});
