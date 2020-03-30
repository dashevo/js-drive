const DriveDataProvider = require('../../../lib/dpp/DriveDataProvider');

describe('DriveDataProvider', () => {
  let dataProvider;
  let identityRepositoryMock;
  let data;
  let dataContractRepositoryMock;
  let fetchDocumentsMock;
  let coreRpcClientMock;
  let blockExecutionDBTransactionsMock;
  let id;

  beforeEach(function beforeEach() {
    data = 'data';
    id = 'id';

    coreRpcClientMock = {
      getRawTransaction: this.sinon.stub(),
    };

    dataContractRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
    };

    blockExecutionDBTransactionsMock = {
      getTransaction: this.sinon.stub(),
    };

    fetchDocumentsMock = this.sinon.stub();

    dataProvider = new DriveDataProvider(
      identityRepositoryMock,
      dataContractRepositoryMock,
      fetchDocumentsMock,
      coreRpcClientMock,
      blockExecutionDBTransactionsMock,
    );
  });

  describe('#fetchDataContract', () => {
    it('should fetch data contract from repository', async () => {
      dataContractRepositoryMock.fetch.resolves(data);

      const result = await dataProvider.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataContractRepositoryMock.fetch).to.be.calledOnceWith(id);
    });
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from repository', async () => {
      const transaction = 'transaction';
      identityRepositoryMock.fetch.resolves(data);
      blockExecutionDBTransactionsMock.getTransaction.returns(transaction);

      const result = await dataProvider.fetchIdentity(id);

      expect(result).to.equal(data);
      expect(identityRepositoryMock.fetch).to.be.calledOnceWith(id, transaction);
      expect(blockExecutionDBTransactionsMock.getTransaction).to.be.calledOnceWith('identities');
    });
  });

  describe('#fetchDocuments', () => {
    it('should fetch documents from repository', async () => {
      const contractId = 'id';
      const type = 1;
      const options = {};
      const transaction = 'transaction';
      fetchDocumentsMock.resolves(data);
      blockExecutionDBTransactionsMock.getTransaction.returns(transaction);

      const result = await dataProvider.fetchDocuments(contractId, type, options);

      expect(result).to.equal(data);
      expect(fetchDocumentsMock).to.be.calledOnceWith(contractId, type, options, transaction);
      expect(blockExecutionDBTransactionsMock.getTransaction).to.be.calledOnceWith('documents');
    });
  });

  describe('#fetchTransaction', () => {
    it('should fetch transaction from core', async () => {
      const rawTransaction = 'some result';

      coreRpcClientMock.getRawTransaction.resolves({ result: rawTransaction });

      const result = await dataProvider.fetchTransaction(id);

      expect(result).to.equal(rawTransaction);
      expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
    });

    it('should return null if core throws Invalid address or key error', async () => {
      const error = new Error('Some error');
      error.code = -5;

      coreRpcClientMock.getRawTransaction.throws(error);

      const result = await dataProvider.fetchTransaction(id);

      expect(result).to.equal(null);
      expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
    });

    it('should throw an error if core throws an unknown error', async () => {
      const error = new Error('Some error');

      coreRpcClientMock.getRawTransaction.throws(error);

      try {
        await dataProvider.fetchTransaction(id);

        expect.fail('should throw error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
      }
    });
  });
});
