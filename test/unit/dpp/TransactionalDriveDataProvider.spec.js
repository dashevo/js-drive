const TransactionalMachineDataProvider = require('../../../lib/dpp/TransactionalMachineDataProvider');

describe('TransactionalMachineDataProvider', () => {
  let dataProvider;
  let contractCacheMock;
  let driveApiClientMock;
  let identityRepositoryMock;
  let blockExecutionDBTransactionsMock;
  let identity;
  let identityTransaction;

  beforeEach(function beforeEach() {
    identity = 'identity';
    identityTransaction = 'identityTransaction';

    contractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    driveApiClientMock = {
      request: this.sinon.stub(),
    };

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    blockExecutionDBTransactionsMock = {
      getIdentityTransaction: this.sinon.stub().returns(identityTransaction),
    };

    dataProvider = new TransactionalMachineDataProvider(
      driveApiClientMock,
      contractCacheMock,
      identityRepositoryMock,
      blockExecutionDBTransactionsMock,
    );
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from repository', async () => {
      const id = 'id';
      identityRepositoryMock.fetch.resolves(identity);

      const result = await dataProvider.fetchIdentity(id);

      expect(result).to.equal(identity);
      expect(blockExecutionDBTransactionsMock.getIdentityTransaction).to.be.calledOnce();

      expect(identityRepositoryMock.fetch).to.be.calledOnceWithExactly(id, identityTransaction);
    });
  });
});
