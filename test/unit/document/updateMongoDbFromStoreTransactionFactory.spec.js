const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');

const updateMongoDbFromStoreTransactionFactory = require('../../../lib/document/populateMongoDbTransactionFromObjectFactory');
const DocumentsDBTransactionIsNotStartedError = require('../../../lib/document/errors/DocumentsDBTransactionIsNotStartedError');

describe('updateMongoDbFromStoreTransactionFactory', () => {
  let updateMongoDbFromStoreTransaction;
  let getDocumentMongoDbDatabaseMock;
  let dppMock;
  let mongoDbMock;
  let transactionMock;
  let dataToUpdate;
  let dataToDelete;
  let documentToCreate;
  let documentToDelete;

  beforeEach(function beforeEach() {
    [documentToCreate, documentToDelete] = getDocumentsFixture();

    dataToUpdate = new Map();
    dataToUpdate.set('documentIdToCreate', documentToCreate.toBuffer());

    dataToDelete = new Map();
    dataToDelete.set('documentIdToDelete', documentToDelete.toBuffer());

    transactionMock = {
      isStarted: this.sinon.stub(),
      storeTransaction: {
        db: {
          data: dataToUpdate,
          deleted: dataToDelete,
        },
      },
    };

    mongoDbMock = {
      delete: this.sinon.stub(),
      store: this.sinon.stub(),
    };

    getDocumentMongoDbDatabaseMock = this.sinon.stub().resolves(mongoDbMock);

    dppMock = createDPPMock(this.sinon);
    dppMock.document.createFromBuffer.resolves(documentToCreate);

    updateMongoDbFromStoreTransaction = updateMongoDbFromStoreTransactionFactory(
      getDocumentMongoDbDatabaseMock,
      dppMock,
    );
  });

  it('should throw DocumentsDBTransactionIsNotStartedError error if transaction is not started', async () => {
    transactionMock.isStarted.returns(false);

    try {
      await updateMongoDbFromStoreTransaction(transactionMock);

      expect.fail('should throw DocumentsDBTransactionIsNotStartedError');
    } catch (e) {
      expect(e).to.be.an.instanceOf(DocumentsDBTransactionIsNotStartedError);
    }
  });

  it('should return updated transaction', async () => {
    transactionMock.isStarted.returns(true);

    await updateMongoDbFromStoreTransaction(transactionMock);

    expect(dppMock.document.createFromBuffer).to.be.calledTwice();
    expect(dppMock.document.createFromBuffer.getCall(0)).to.be.calledWithExactly(
      documentToCreate.toBuffer(),
      {
        skipValidation: true,
      },
    );
    expect(dppMock.document.createFromBuffer.getCall(1)).to.be.calledWithExactly(
      documentToDelete.toBuffer(),
      {
        skipValidation: true,
      },
    );

    expect(getDocumentMongoDbDatabaseMock).to.be.calledTwice();
    expect(getDocumentMongoDbDatabaseMock.getCall(0)).to.be.calledWithExactly(
      documentToCreate.getDataContractId(),
    );
    expect(getDocumentMongoDbDatabaseMock.getCall(1)).to.be.calledWithExactly(
      documentToDelete.getDataContractId(),
    );

    expect(mongoDbMock.store).to.be.calledOnceWithExactly(documentToCreate);
    expect(mongoDbMock.delete).to.be.calledOnceWithExactly('documentIdToDelete');
  });
});
