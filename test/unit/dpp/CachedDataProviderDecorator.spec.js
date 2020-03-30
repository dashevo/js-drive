const CachedDataProviderDecorator = require('../../../lib/dpp/CachedDataProviderDecorator');

describe('CachedDataProviderDecorator', () => {
  let dataProviderMock;
  let dataProvider;
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

    dataProviderMock = {
      fetchIdentity: this.sinon.stub(),
      fetchDocuments: this.sinon.stub(),
      fetchTransaction: this.sinon.stub(),
      fetchDataContract: this.sinon.stub(),
    };

    dataProvider = new CachedDataProviderDecorator(
      dataProviderMock,
      dataContractCacheMock,
    );
  });

  describe('#fetchIdentity', () => {
    it('should fetch identity from repository', async () => {
      dataProviderMock.fetchIdentity.resolves(data);

      const result = await dataProvider.fetchIdentity(id);

      expect(result).to.equal(data);
      expect(dataProviderMock.fetchIdentity).to.be.calledOnceWith(id);
    });
  });

  describe('#fetchDocuments', () => {
    it('should fetch documents from repository', async () => {
      const contractId = 'contractId';
      const type = 1;
      const options = {};

      dataProviderMock.fetchDocuments.resolves(data);

      const result = await dataProvider.fetchDocuments(contractId, type, options);

      expect(result).to.equal(data);
      expect(dataProviderMock.fetchDocuments).to.be.calledOnceWith(contractId, type, options);
    });
  });

  describe('fetchTransaction', () => {
    it('should fetch transaction from repository', async () => {
      dataProviderMock.fetchTransaction.resolves(data);

      const result = await dataProvider.fetchTransaction(id);

      expect(result).to.equal(data);
      expect(dataProviderMock.fetchTransaction).to.be.calledOnceWith(id);
    });
  });

  describe('#fetchDataContract', () => {
    it('should fetch contract from cache', async () => {
      dataContractCacheMock.get.returns(data);

      const result = await dataProvider.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataProviderMock.fetchDataContract).to.be.not.called();
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
    });

    it('should fetch contract from repository if it is not present in cache', async () => {
      dataContractCacheMock.get.returns(null);
      dataProviderMock.fetchDataContract.resolves(data);

      const result = await dataProvider.fetchDataContract(id);

      expect(result).to.equal(data);
      expect(dataContractCacheMock.get).to.be.calledOnceWith(id);
      expect(dataProviderMock.fetchDataContract).to.be.calledOnceWith(id);
    });
  });
});
