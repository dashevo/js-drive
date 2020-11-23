const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const createDocumentDbFromStoreTransactionFactory = require('../../../lib/dataContract/createPreviousDocumentDatabasesFromTransactionObjectFactory');
const MerkDBTransactionIsNotStartedError = require('../../../lib/merkDb/errors/MerkDBTransactionIsNotStartedError');

describe('createDocumentDbFromStoreTransactionFactory', () => {
  let createDocumentDbFromStoreTransaction;
  let documentDatabaseManagerMock;
  let dppMock;
  let transactionMock;
  let transactionData;
  let dataContract;

  beforeEach(function beforeEach() {
    dataContract = getDataContractFixture();
    dppMock = createDPPMock(this.sinon);

    dppMock.dataContract.createFromBuffer.resolves(dataContract);

    documentDatabaseManagerMock = {
      create: this.sinon.stub(),
    };

    createDocumentDbFromStoreTransaction = createDocumentDbFromStoreTransactionFactory(
      documentDatabaseManagerMock,
      dppMock,
    );

    transactionData = new Map();
    transactionData.set('key', dataContract.toBuffer());

    transactionMock = {
      isStarted: this.sinon.stub(),
      db: {
        data: transactionData,
      },
    };
  });

  it('should throw MerkDBTransactionIsNotStartedError if transaction is not started', async () => {
    transactionMock.isStarted.returns(false);

    try {
      await createDocumentDbFromStoreTransaction(
        transactionMock,
      );

      expect.fail('should throw MerkDBTransactionIsNotStartedError error');
    } catch (e) {
      expect(e).to.be.an.instanceOf(MerkDBTransactionIsNotStartedError);
    }
  });

  it('should create DocumentDbFromStoreTransaction', async () => {
    transactionMock.isStarted.returns(true);

    await createDocumentDbFromStoreTransaction(
      transactionMock,
    );

    expect(dppMock.dataContract.createFromBuffer).to.be.calledOnceWithExactly(
      dataContract.toBuffer(),
      {
        skipValidation: true,
      },
    );
    expect(documentDatabaseManagerMock.create).to.be.calledOnceWithExactly(dataContract);
  });
});
