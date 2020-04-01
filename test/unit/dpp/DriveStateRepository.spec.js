const DriveStateRepository = require('../../../lib/dpp/DriveStateRepository');

describe('DriveStateRepository', () => {
  let stateRepository;
  let identityRepositoryMock;
  let data;
  let dataContractRepositoryMock;
  let fetchDocumentsMock;
  let createDocumentRepositoryMock;
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

    createDocumentRepositoryMock = this.sinon.stub();

    stateRepository = new DriveStateRepository(
      identityRepositoryMock,
      dataContractRepositoryMock,
      fetchDocumentsMock,
      createDocumentRepositoryMock,
      coreRpcClientMock,
      blockExecutionDBTransactionsMock,
    );
  });

  describe('#fetchDataContract', () => {
    it('should fetch data contract from repository', async () => {
      dataContractRepositoryMock.fetch.resolves(data);

      const result = await stateRepository.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataContractRepositoryMock.fetch).to.be.calledOnceWith(id);
    });
  });

  describe('#storeDataContract', () => {
    it('should store data contract to repository');
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from repository', async () => {
      const transaction = 'transaction';
      identityRepositoryMock.fetch.resolves(data);
      blockExecutionDBTransactionsMock.getTransaction.returns(transaction);

      const result = await stateRepository.fetchIdentity(id);

      expect(result).to.equal(data);
      expect(identityRepositoryMock.fetch).to.be.calledOnceWith(id, transaction);
      expect(blockExecutionDBTransactionsMock.getTransaction).to.be.calledOnceWith('identity');
    });
  });

  describe('#storeIdentity', () => {
    it('should store identity to repository');
  });

  describe('#fetchDocuments', () => {
    it('should fetch documents from repository', async () => {
      const contractId = 'id';
      const type = 1;
      const options = {};
      const transaction = 'transaction';
      fetchDocumentsMock.resolves(data);
      blockExecutionDBTransactionsMock.getTransaction.returns(transaction);

      const result = await stateRepository.fetchDocuments(contractId, type, options);

      expect(result).to.equal(data);
      expect(fetchDocumentsMock).to.be.calledOnceWith(contractId, type, options, transaction);
      expect(blockExecutionDBTransactionsMock.getTransaction).to.be.calledOnceWith('document');
    });
  });

  describe('#storeDocument', () => {
    it('should store document in repository');
  });

  describe('#removeDocument', () => {
    it('should delete document from repository');
  });

  describe('#fetchTransaction', () => {
    it('should fetch transaction from core', async () => {
      const rawTransaction = 'some result';

      coreRpcClientMock.getRawTransaction.resolves({ result: rawTransaction });

      const result = await stateRepository.fetchTransaction(id);

      expect(result).to.equal(rawTransaction);
      expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
    });

    it('should return null if core throws Invalid address or key error', async () => {
      const error = new Error('Some error');
      error.code = -5;

      coreRpcClientMock.getRawTransaction.throws(error);

      const result = await stateRepository.fetchTransaction(id);

      expect(result).to.equal(null);
      expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
    });

    it('should throw an error if core throws an unknown error', async () => {
      const error = new Error('Some error');

      coreRpcClientMock.getRawTransaction.throws(error);

      try {
        await stateRepository.fetchTransaction(id);

        expect.fail('should throw error');
      } catch (e) {
        expect(e).to.equal(error);
        expect(coreRpcClientMock.getRawTransaction).to.be.calledOnceWith(id);
      }
    });
  });
});
