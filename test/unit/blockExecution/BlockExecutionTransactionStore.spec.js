const cbor = require('cbor');

const BlockExecutionTransactionStore = require('../../../lib/blockExecution/PreviousBlockExecutionStoreTransactionsRepository');

describe('BlockExecutionTransactionStore', () => {
  let blockExecutionTransactionStore;
  let blockExecutionTransactionDBMock;
  let batchMock;
  let transactions;
  let identitiesTransactionMock;
  let documentsTransactionMock;
  let dataContractsTransactionMock;
  let publicKeyToIdentityIdTransactionMock;
  let serializedTransactions;
  let identity;
  let document;
  let dataContract;
  let publicKeyToIdentityId;

  beforeEach(function beforeEach() {
    batchMock = {
      put: this.sinon.stub(),
      delete: this.sinon.stub(),
      commitSync: this.sinon.stub(),
    };

    batchMock.put.returns(batchMock);
    batchMock.delete.returns(batchMock);
    batchMock.commitSync.returns(batchMock);

    blockExecutionTransactionDBMock = {
      batch: this.sinon.stub().returns(batchMock),
      getSync: this.sinon.stub(),
    };

    blockExecutionTransactionStore = new BlockExecutionTransactionStore(
      blockExecutionTransactionDBMock,
    );

    identity = 'identity';
    document = 'documents';
    dataContract = 'dataContracts';
    publicKeyToIdentityId = 'publicKeyToIdentityId';

    identitiesTransactionMock = {
      toPlainObject: this.sinon.stub().returns(identity),
      updateFromPlainObject: this.sinon.stub(),
    };

    documentsTransactionMock = {
      toPlainObject: this.sinon.stub().returns(document),
      updateFromPlainObject: this.sinon.stub(),
    };

    dataContractsTransactionMock = {
      toPlainObject: this.sinon.stub().returns(dataContract),
      updateFromPlainObject: this.sinon.stub(),
    };

    publicKeyToIdentityIdTransactionMock = {
      toPlainObject: this.sinon.stub().returns(publicKeyToIdentityId),
      updateFromPlainObject: this.sinon.stub(),
    };

    transactions = {
      identity: identitiesTransactionMock,
      document: documentsTransactionMock,
      dataContract: dataContractsTransactionMock,
      publicKeyToIdentityId: publicKeyToIdentityIdTransactionMock,
    };

    serializedTransactions = cbor.encode({
      identity,
      document,
      dataContract,
      publicKeyToIdentityId,
    });
  });

  describe('#store', () => {
    it('should transactions into DB', () => {
      blockExecutionTransactionStore.store(transactions);

      expect(blockExecutionTransactionDBMock.batch).to.be.calledOnce();
      expect(batchMock.put).to.be.calledOnceWithExactly(
        Buffer.from('transactions'),
        serializedTransactions,
      );
      expect(batchMock.commitSync).to.be.calledOnce();
    });
  });

  describe('#fetchAndUpdate', () => {
    it('should do nothing if there are no stored transactions', () => {
      blockExecutionTransactionDBMock.getSync.returns(null);

      blockExecutionTransactionStore.fetchAndUpdate(transactions);

      expect(transactions.identity.updateFromPlainObject).to.be.not.called();
      expect(transactions.document.updateFromPlainObject).to.be.not.called();
      expect(transactions.dataContract.updateFromPlainObject).to.be.not.called();
      expect(transactions.publicKeyToIdentityId.updateFromPlainObject).to.be.not.called();
    });

    it('should fetch the latest state from DB and update transactions with it', () => {
      blockExecutionTransactionDBMock.getSync.returns(serializedTransactions);

      blockExecutionTransactionStore.fetchAndUpdate(transactions);

      expect(transactions.identity.updateFromPlainObject).to.be.calledOnceWithExactly(
        identity,
      );
      expect(transactions.document.updateFromPlainObject).to.be.calledOnceWithExactly(
        document,
      );
      expect(transactions.dataContract.updateFromPlainObject).to.be.calledOnceWithExactly(
        dataContract,
      );
      expect(transactions.publicKeyToIdentityId.updateFromPlainObject)
        .to.be.calledOnceWithExactly(
          publicKeyToIdentityId,
        );
    });
  });

  describe('#clear', () => {
    it('should clear DB state', () => {
      blockExecutionTransactionStore.clear();

      expect(blockExecutionTransactionDBMock.batch).to.be.calledOnce();
      expect(batchMock.put).to.be.calledOnceWithExactly(
        Buffer.from('transactions'),
        Buffer.alloc(0),
      );
      expect(batchMock.commitSync).to.be.calledOnce();
    });
  });
});
