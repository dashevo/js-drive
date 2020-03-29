const BlockExecutionDBTransactions = require('../../../lib/abci/BlockExecutionDBTransactions');

describe('BlockExecutionDBTransactions', () => {
  let blockExecutionDBTransactions;
  let identityTransactionMock;

  beforeEach(function beforeEach() {
    identityTransactionMock = {
      commit: this.sinon.stub(),
    };

    blockExecutionDBTransactions = new BlockExecutionDBTransactions();
  });

  it('should set identity DB transaction', () => {
    blockExecutionDBTransactions.setIdentityTransaction(identityTransactionMock);

    const { transactions } = blockExecutionDBTransactions;

    expect(transactions).to.deep.equal({
      identity: identityTransactionMock,
    });
  });

  it('should return identity DB transaction', () => {
    blockExecutionDBTransactions.setIdentityTransaction(identityTransactionMock);

    const transaction = blockExecutionDBTransactions.getIdentityTransaction();

    expect(transaction).to.deep.equal(identityTransactionMock);
  });

  it('should commit all transactions', async () => {
    blockExecutionDBTransactions.setIdentityTransaction(identityTransactionMock);

    await blockExecutionDBTransactions.commit();

    expect(identityTransactionMock.commit).to.be.calledOnce();
  });
});
