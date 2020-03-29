const sinon = require('sinon');
const { Reference } = require('isolated-vm');
const { Transaction } = require('@dashevo/dashcore-lib');
const Document = require('@dashevo/dpp/lib/document/Document');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');

const createDataProviderMock = require('@dashevo/dpp/lib/test/mocks/createDataProviderMock');
const IsolatedDataProviderWrapper = require('../../../../../lib/dpp/isolation/dpp/internal/ExternalDataProvider');

describe('IsolatedDataProviderWrapper', function describeIsolatedDataProviderWrapper() {
  let dataProviderMock;
  let dataProviderMockReference;
  let dataProviderWrapper;
  let dataContractFixture;
  let identityFixture;
  let transactionFixture;

  this.timeout(100000);

  beforeEach(() => {
    dataProviderMock = createDataProviderMock(sinon);
    dataProviderMockReference = new Reference(dataProviderMock);
    dataProviderWrapper = new IsolatedDataProviderWrapper(dataProviderMockReference);
    dataContractFixture = getDataContractFixture();
    identityFixture = getIdentityFixture();
    transactionFixture = new Transaction('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac00000000');
  });

  describe('fetchDocuments', () => {
    it('should return an array of documents', async () => {
      const documentType = 1;
      const contractId = 2;
      const documentsMock = [new Document({
        $type: documentType,
        $contractId: contractId,
        $userId: 3,
        $entropy: 4,
        $rev: 5,
      })];
      dataProviderMock.fetchDocuments.resolves(documentsMock);
      const where = { where: [['a' === '1']] };

      const actualDocuments = await dataProviderWrapper
        .fetchDocuments(contractId, documentType, where);

      expect(actualDocuments).to.be.deep.equal(documentsMock);
      expect(
        dataProviderMock.fetchDocuments.calledWithExactly(contractId, documentType, where),
      ).to.be.true();
    });
  });

  describe('fetchDataContract', () => {
    it('should return DataContract', async () => {
      const contractId = 1;
      dataProviderMock.fetchDataContract.withArgs(contractId).resolves(dataContractFixture);

      const actualDataContract = await dataProviderWrapper.fetchDataContract(contractId);
      expect(actualDataContract).to.be.deep.equal(dataContractFixture);
    });
    it('should return null if no data dataContracts found', async () => {
      const contractId = 1;

      const actualDataContract = await dataProviderWrapper.fetchDataContract(contractId);
      expect(actualDataContract).to.be.equal(null);
    });
  });

  describe('fetchIdentity', () => {
    it('should return identity', async () => {
      const identityId = 1;
      dataProviderMock.fetchIdentity.withArgs(identityId).resolves(identityFixture);

      const actualIdentity = await dataProviderWrapper.fetchIdentity(identityId);
      expect(actualIdentity).to.be.deep.equal(identityFixture);
    });
    it('should return null if no identity found', async () => {
      const identityId = 1;

      const actualIdentity = await dataProviderWrapper.fetchIdentity(identityId);
      expect(actualIdentity).to.be.equal(null);
    });
  });

  describe('fetchTransaction', () => {
    it('should return transaction', async () => {
      const transactionId = 1;
      dataProviderMock.fetchTransaction.withArgs(transactionId).resolves(transactionFixture);

      const actualTransaction = await dataProviderWrapper.fetchTransaction(transactionId);
      expect(actualTransaction.toObject()).to.be.deep.equal(transactionFixture.toObject());
    });
    it('should return null if no transaction found', async () => {
      const transactionId = 1;

      const actualTransaction = await dataProviderWrapper.fetchTransaction(transactionId);
      expect(actualTransaction).to.be.equal(null);
    });
  });
});
