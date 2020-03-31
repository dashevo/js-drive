const CachedStateRepositoryDecorator = require('../../../lib/dpp/CachedStateRepositoryDecorator');

describe('CachedStateRepositoryDecorator', () => {
  let stateRepositoryMock;
  let stateRepository;
  let dataContractCacheMock;
  let data;
  let id;

  beforeEach(function beforeEach() {
    data = 'some data';
    id = 'id';

    dataContractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    stateRepositoryMock = {
      fetchIdentity: this.sinon.stub(),
      fetchDocuments: this.sinon.stub(),
      fetchTransaction: this.sinon.stub(),
      fetchDataContract: this.sinon.stub(),
    };

    stateRepository = new CachedStateRepositoryDecorator(
      stateRepositoryMock,
      dataContractCacheMock,
    );
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from state repository', async () => {
      stateRepositoryMock.fetchIdentity.resolves(data);

      const result = await stateRepository.fetchIdentity(id);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchIdentity).to.be.calledOnceWith(id);
    });
  });

  describe('#storeIdentity', () => {
    it('should store identity to repository');
  });

  describe('#fetchDocuments', () => {
    it('should fetch documents from state repository', async () => {
      const contractId = 'contractId';
      const type = 1;
      const options = {};

      stateRepositoryMock.fetchDocuments.resolves(data);

      const result = await stateRepository.fetchDocuments(contractId, type, options);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchDocuments).to.be.calledOnceWith(contractId, type, options);
    });
  });

  describe('#storeDocument', () => {
    it('should store document in repository');
  });

  describe('#removeDocument', () => {
    it('should delete document from repository');
  });

  describe('fetchTransaction', () => {
    it('should fetch transaction from state repository', async () => {
      stateRepositoryMock.fetchTransaction.resolves(data);

      const result = await stateRepository.fetchTransaction(id);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchTransaction).to.be.calledOnceWith(id);
    });
  });

  describe('#fetchDataContract', () => {
    it('should fetch data contract from cache', async () => {
      dataContractCacheMock.get.returns(data);

      const result = await stateRepository.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchDataContract).to.be.not.called();
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
    });

    it('should fetch data contract from state repository if it is not present in cache', async () => {
      dataContractCacheMock.get.returns(null);
      stateRepositoryMock.fetchDataContract.resolves(data);

      const result = await stateRepository.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
      expect(stateRepositoryMock.fetchDataContract).to.be.calledOnceWith(id);
    });
  });
});
