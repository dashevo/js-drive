const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const queryHandlerFactory = require('../../../../lib/abci/handlers/queryHandlerFactory');
const InvalidIdentityIdError = require('../../../../lib/identity/errors/InvalidIdentityIdError');

const AbciError = require('../../../../lib/abci/errors/AbciError');
const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');

describe('queryHandlerFactory', () => {
  let queryHandler;
  let identityRepositoryMock;
  let identity;
  let request;

  beforeEach(function beforeEach() {
    identity = getIdentityFixture();

    request = {
      path: '/identity',
      data: [...Buffer.from(identity.getId())],
    };

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    identityRepositoryMock.fetch.withArgs(identity.getId()).resolves(identity);
    identityRepositoryMock.fetch.withArgs('unknownId').resolves(null);
    identityRepositoryMock.fetch.withArgs(null).throws(new InvalidIdentityIdError(null));

    queryHandler = queryHandlerFactory(identityRepositoryMock);
  });

  it('should fetch identity by id', async () => {
    const response = await queryHandler(request);

    expect(response).to.be.an.instanceOf(Object);
    expect(response.code).to.equal(0);
    expect(response.value).to.deep.equal(identity.serialize());

    expect(identityRepositoryMock.fetch).to.be.calledOnceWithExactly(identity.getId());
  });

  it('should return null if id not found', async () => {
    const id = 'unknownId';
    request.data = [...Buffer.from(id)];

    const response = await queryHandler(request);

    expect(response).to.be.an.instanceOf(Object);
    expect(response.code).to.equal(0);
    expect(response.value).to.equal(null);

    expect(identityRepositoryMock.fetch).to.be.calledOnceWithExactly(id);
  });

  it('should throw InvalidArgumentAbciError error if data is not defined', async () => {
    request.data = undefined;

    try {
      await queryHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Data is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);

      expect(identityRepositoryMock.fetch).to.be.not.called();
    }
  });

  it('should return error if path is wrong', async () => {
    request.path = '/wrongPath';

    try {
      await queryHandler(request);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Invalid path');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);

      expect(identityRepositoryMock.fetch).to.be.not.called();
    }
  });
});
