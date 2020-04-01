const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const CachedStateRepositoryDecorator = require('../../../lib/dpp/CachedStateRepositoryDecorator');

describe('CachedStateRepositoryDecorator', () => {
  let stateRepositoryMock;
  let cachedStateRepository;
  let dataContractCacheMock;
  let data;
  let id;
  let identity;
  let documents;

  beforeEach(function beforeEach() {
    data = 'some data';
    id = 'id';
    identity = getIdentityFixture();
    documents = getDocumentsFixture();

    dataContractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    stateRepositoryMock = {
      fetchIdentity: this.sinon.stub(),
      fetchDocuments: this.sinon.stub(),
      fetchTransaction: this.sinon.stub(),
      fetchDataContract: this.sinon.stub(),
      storeIdentity: this.sinon.stub(),
      storeDocument: this.sinon.stub(),
      removeDocument: this.sinon.stub(),
    };

    cachedStateRepository = new CachedStateRepositoryDecorator(
      stateRepositoryMock,
      dataContractCacheMock,
    );
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from state repository', async () => {
      stateRepositoryMock.fetchIdentity.resolves(identity);

      const result = await cachedStateRepository.fetchIdentity(id);

      expect(result).to.deep.equal(identity);
      expect(stateRepositoryMock.fetchIdentity).to.be.calledOnceWith(id);
    });
  });

  describe('#storeIdentity', () => {
    it('should store identity to repository', async () => {
      const resultValue = 'resultValue';
      stateRepositoryMock.storeIdentity.resolves(resultValue);

      const result = await cachedStateRepository.storeIdentity(identity);

      expect(stateRepositoryMock.storeIdentity).to.be.calledOnceWith(identity);
      expect(result).to.equal(resultValue);
    });
  });

  describe('#fetchDocuments', () => {
    it('should fetch documents from state repository', async () => {
      const contractId = 'contractId';
      const type = 1;
      const options = {};

      stateRepositoryMock.fetchDocuments.resolves(data);

      const result = await cachedStateRepository.fetchDocuments(contractId, type, options);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchDocuments).to.be.calledOnceWith(contractId, type, options);
    });
  });

  describe('#storeDocument', () => {
    it('should store document in repository', async () => {
      const [document] = documents;
      const resultValue = 'resultValue';
      stateRepositoryMock.storeDocument.resolves(resultValue);

      const result = await cachedStateRepository.storeDocument(document);

      expect(stateRepositoryMock.storeDocument).to.be.calledOnceWith(document);
      expect(result).to.equal(resultValue);
    });
  });

  describe('#removeDocument', () => {
    it('should delete document from repository', async () => {
      const contractId = 'contractId';
      const type = 1;
      const resultValue = 'resultValue';

      stateRepositoryMock.removeDocument.resolves(resultValue);

      const result = await cachedStateRepository.removeDocument(contractId, type, id);

      expect(stateRepositoryMock.removeDocument).to.be.calledOnceWith(contractId, type, id);
      expect(result).to.equal(resultValue);
    });
  });

  describe('fetchTransaction', () => {
    it('should fetch transaction from state repository', async () => {
      stateRepositoryMock.fetchTransaction.resolves(data);

      const result = await cachedStateRepository.fetchTransaction(id);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchTransaction).to.be.calledOnceWith(id);
    });
  });

  describe('#fetchDataContract', () => {
    it('should fetch data contract from cache', async () => {
      dataContractCacheMock.get.returns(data);

      const result = await cachedStateRepository.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(stateRepositoryMock.fetchDataContract).to.be.not.called();
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
    });

    it('should fetch data contract from state repository if it is not present in cache', async () => {
      dataContractCacheMock.get.returns(undefined);
      stateRepositoryMock.fetchDataContract.resolves(data);

      const result = await cachedStateRepository.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
      expect(stateRepositoryMock.fetchDataContract).to.be.calledOnceWith(id);
    });
  });
});
