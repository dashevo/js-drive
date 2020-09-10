const {
  abci: {
    ResponseQuery,
  },
} = require('abci/types');

const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const identityByPublicKeyQueryHandlerFactory = require(
  '../../../../../lib/abci/handlers/query/identityByPublicKeyQueryHandlerFactory',
);

const NotFoundAbciError = require('../../../../../lib/abci/errors/NotFoundAbciError');
const AbciError = require('../../../../../lib/abci/errors/AbciError');

describe('identityByPublicKeyQueryHandlerFactory', () => {
  let identityRepositoryMock;
  let publicKeyIdentityIdRepositoryMock;
  let identityByPublicKeyQueryHandler;
  let publicKeyHash;
  let identity;
  let identityId;

  beforeEach(function beforeEach() {
    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };
    publicKeyIdentityIdRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    identityByPublicKeyQueryHandler = identityByPublicKeyQueryHandlerFactory(
      publicKeyIdentityIdRepositoryMock,
      identityRepositoryMock,
    );

    publicKeyHash = 'publicKeyHash';
    identityId = 'identityId';

    identity = getIdentityFixture();
  });

  it('should return serialized identity', async () => {
    identityRepositoryMock.fetch.resolves(identity);
    publicKeyIdentityIdRepositoryMock.fetch.resolves(identityId);

    const result = await identityByPublicKeyQueryHandler({ publicKeyHash });

    expect(identityRepositoryMock.fetch).to.be.calledOnceWith(identityId);
    expect(publicKeyIdentityIdRepositoryMock.fetch).to.be.calledOnceWith(publicKeyHash);
    expect(result).to.be.an.instanceof(ResponseQuery);
    expect(result.code).to.equal(0);
    expect(result.value).to.deep.equal(identity.serialize());
  });

  it('should throw NotFoundAbciError if identityId not found', async () => {
    try {
      await identityByPublicKeyQueryHandler({ publicKeyHash });

      expect.fail('should throw NotFoundAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(NotFoundAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.NOT_FOUND);
      expect(e.message).to.equal('Identity not found');
      expect(publicKeyIdentityIdRepositoryMock.fetch).to.be.calledOnceWith(publicKeyHash);
      expect(identityRepositoryMock.fetch).to.be.not.called();
    }
  });

  it('should throw NotFoundAbciError if identity not found', async () => {
    publicKeyIdentityIdRepositoryMock.fetch.resolves(identityId);

    try {
      await identityByPublicKeyQueryHandler({ publicKeyHash });

      expect.fail('should throw NotFoundAbciError');
    } catch (e) {
      expect(e).to.be.an.instanceof(NotFoundAbciError);
      expect(e.getCode()).to.equal(AbciError.CODES.NOT_FOUND);
      expect(e.message).to.equal('Identity not found');
      expect(publicKeyIdentityIdRepositoryMock.fetch).to.be.calledOnceWith(publicKeyHash);
      expect(identityRepositoryMock.fetch).to.be.calledOnceWith(identityId);
    }
  });
});
