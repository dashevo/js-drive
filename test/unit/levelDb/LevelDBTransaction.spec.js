const levelup = require('levelup');
const memdown = require('memdown');
const Transactions = require('level-transactions');

const LevelDBTransaction = require('../../../lib/levelDb/LevelDBTransaction');

const LevelDBTransactionIsNotStartedError = require('../../../lib/levelDb/errors/LevelDBTransactionIsNotStartedError');
const LevelDBTransactionIsAlreadyStartedError = require('../../../lib/levelDb/errors/LevelDBTransactionIsAlreadyStartedError');

describe('LevelDBTransaction', () => {
  let dbMock;
  let levelDBTransaction;

  beforeEach(() => {
    dbMock = levelup(memdown());
    levelDBTransaction = new LevelDBTransaction(dbMock);
  });

  afterEach(async () => {
    await dbMock.clear();
    await dbMock.close();
  });

  it('should start transaction', () => {
    levelDBTransaction.start();

    expect(levelDBTransaction.db).to.be.instanceOf(Transactions);
  });

  it('should commit transaction', async function it() {
    const commit = this.sinon.stub();
    levelDBTransaction.db = {
      commit,
    };

    const result = await levelDBTransaction.commit();

    expect(result).to.be.instanceOf(Object);
    expect(commit).to.be.calledOnce();
  });

  it('should fail if transaction was started twice', async () => {
    levelDBTransaction.start();

    try {
      levelDBTransaction.start();

      expect.fail('Should throw an LevelDBTransactionIsAlreadyStartedError error');
    } catch (e) {
      expect(e).to.be.instanceOf(LevelDBTransactionIsAlreadyStartedError);
    }
  });

  it('should fail on commit if transaction is not started', async () => {
    try {
      await levelDBTransaction.commit();

      expect.fail('Should throw an LevelDBTransactionIsNotStartedError error');
    } catch (e) {
      expect(e).to.be.instanceOf(LevelDBTransactionIsNotStartedError);
    }
  });
});
