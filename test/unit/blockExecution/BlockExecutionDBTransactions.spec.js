const BlockExecutionDBTransactions = require('../../../lib/blockExecution/BlockExecutionDBTransactions');

describe('BlockExecutionDBTransactions', () => {
  let blockExecutionDBTransactions;
  let identitiesTransactionMock;
  let documentsTransactionMock;
  let dataContractsTransactionMock;
  let publicKeyToIdentityIdTransactionMock;
  let previousIdentitiesTransactionMock;
  let previousDocumentsTransactionMock;
  let previousDataContractsTransactionMock;
  let previousPublicKeyToIdentityIdTransactionMock;
  let blockExecutionTransactionStoreMock;

  beforeEach(function beforeEach() {
    identitiesTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    documentsTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    dataContractsTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    publicKeyToIdentityIdTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    previousIdentitiesTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    previousDocumentsTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    previousDataContractsTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    previousPublicKeyToIdentityIdTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    blockExecutionTransactionStoreMock = {
      store: this.sinon.stub(),
      fetchAndUpdate: this.sinon.stub(),
    };

    blockExecutionDBTransactions = new BlockExecutionDBTransactions(
      identitiesTransactionMock,
      documentsTransactionMock,
      dataContractsTransactionMock,
      publicKeyToIdentityIdTransactionMock,
      previousIdentitiesTransactionMock,
      previousDocumentsTransactionMock,
      previousDataContractsTransactionMock,
      previousPublicKeyToIdentityIdTransactionMock,
      blockExecutionTransactionStoreMock,
    );
  });

  it('should start transactions', () => {
    blockExecutionDBTransactions.start();

    expect(identitiesTransactionMock.start).to.be.calledOnce();
    expect(documentsTransactionMock.start).to.be.calledOnce();
    expect(dataContractsTransactionMock.start).to.be.calledOnce();
    expect(publicKeyToIdentityIdTransactionMock.start).to.be.calledOnce();

    expect(identitiesTransactionMock.commit).to.be.not.called();
    expect(documentsTransactionMock.commit).to.be.not.called();
    expect(dataContractsTransactionMock.commit).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.commit).to.be.not.called();

    expect(identitiesTransactionMock.abort).to.be.not.called();
    expect(documentsTransactionMock.abort).to.be.not.called();
    expect(dataContractsTransactionMock.abort).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.abort).to.be.not.called();
  });

  it('should commit transactions', async () => {
    await blockExecutionDBTransactions.commit();

    expect(identitiesTransactionMock.commit).to.be.calledOnce();
    expect(documentsTransactionMock.commit).to.be.calledOnce();
    expect(dataContractsTransactionMock.commit).to.be.calledOnce();
    expect(publicKeyToIdentityIdTransactionMock.commit).to.be.calledOnce();

    expect(identitiesTransactionMock.start).to.be.not.called();
    expect(documentsTransactionMock.start).to.be.not.called();
    expect(dataContractsTransactionMock.start).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.start).to.be.not.called();

    expect(identitiesTransactionMock.abort).to.be.not.called();
    expect(documentsTransactionMock.abort).to.be.not.called();
    expect(dataContractsTransactionMock.abort).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.abort).to.be.not.called();

    expect(blockExecutionTransactionStoreMock.store).to.be.calledOnce();
  });

  it('should abort transactions', async () => {
    await blockExecutionDBTransactions.abort();

    expect(identitiesTransactionMock.abort).to.be.calledOnce();
    expect(documentsTransactionMock.abort).to.be.calledOnce();
    expect(dataContractsTransactionMock.abort).to.be.calledOnce();
    expect(publicKeyToIdentityIdTransactionMock.abort).to.be.calledOnce();

    expect(identitiesTransactionMock.start).to.be.not.called();
    expect(documentsTransactionMock.start).to.be.not.called();
    expect(dataContractsTransactionMock.start).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.start).to.be.not.called();

    expect(identitiesTransactionMock.commit).to.be.not.called();
    expect(documentsTransactionMock.commit).to.be.not.called();
    expect(dataContractsTransactionMock.commit).to.be.not.called();
    expect(publicKeyToIdentityIdTransactionMock.commit).to.be.not.called();
  });

  it('should return transaction by name', () => {
    const result = blockExecutionDBTransactions.getTransaction('identity');

    expect(result).to.deep.equal(identitiesTransactionMock);
  });

  it('should return previous transactions', () => {
    const result = blockExecutionDBTransactions.getPreviousTransactions();

    expect(blockExecutionTransactionStoreMock.fetchAndUpdate).to.be.calledOnceWithExactly(
      {
        identity: previousIdentitiesTransactionMock,
        document: previousDocumentsTransactionMock,
        dataContract: previousDataContractsTransactionMock,
        publicKeyToIdentityId: previousPublicKeyToIdentityIdTransactionMock,
      },
    );

    expect(result).to.deep.equal({
      identity: previousIdentitiesTransactionMock,
      document: previousDocumentsTransactionMock,
      dataContract: previousDataContractsTransactionMock,
      publicKeyToIdentityId: previousPublicKeyToIdentityIdTransactionMock,
    },);
  });
});
