const MongoDBTransaction = require('../../../lib/mongoDb/MongoDBTransaction');
const InvalidSessionError = require('../../../lib/mongoDb/errors/InvalidSessionError');

describe('MongoDBTransaction', () => {
  let mongoClientMock;
  let mongoDBTransaction;
  let sessionMock;
  let transactionFunctionMock;

  beforeEach(function beforeEach() {
    sessionMock = {
      startTransaction: this.sinon.stub(),
      commitTransaction: this.sinon.stub(),
      abortTransaction: this.sinon.stub(),
    };

    mongoClientMock = {
      startSession: this.sinon.stub().returns(sessionMock),
    };

    mongoDBTransaction = new MongoDBTransaction(mongoClientMock);
    transactionFunctionMock = this.sinon.stub().resolves(this.sinon.stub());
  });

  describe('#start', () => {
    it('should start session', async () => {
      await mongoDBTransaction.start();

      expect(mongoClientMock.startSession).to.be.calledOnce();
      expect(sessionMock.startTransaction).to.be.calledOnce();
    });

    it('should throw an error, if session is already started', async () => {
      await mongoDBTransaction.start();

      try {
        await mongoDBTransaction.start();

        expect.fail('should throw "Session is already started error"');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidSessionError);
        expect(mongoClientMock.startSession).to.be.calledOnce();
        expect(sessionMock.startTransaction).to.be.calledOnce();
      }
    });
  });

  describe('#commit', () => {
    it('should commit transaction', async () => {
      await mongoDBTransaction.start();
      await mongoDBTransaction.commit();

      expect(sessionMock.commitTransaction).to.be.calledOnce();
    });

    it('should throw an error if session is not started', async () => {
      try {
        await mongoDBTransaction.commit();

        expect.fail('should throw "Session is not started" error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidSessionError);
        expect(sessionMock.commitTransaction).to.have.not.been.called();
      }
    });

    it('should catch UNKNOWN_TRANSACTION_COMMIT_RSEULT error', async () => {
      sessionMock.commitTransaction.onFirstCall().throws({ errorLabels: ['UnknownTransactionCommitResult'] });

      await mongoDBTransaction.start();
      await mongoDBTransaction.commit();

      expect(sessionMock.commitTransaction).to.be.calledTwice();
    });

    it('should throw an error', async () => {
      sessionMock.commitTransaction.throws('UnknownError');

      await mongoDBTransaction.start();

      try {
        await mongoDBTransaction.commit();

        expect.fail('should throw "UnknownError"');
      } catch (error) {
        expect(sessionMock.commitTransaction).to.be.calledOnce();
      }
    });
  });

  describe('#abort', () => {
    it('should abort session', async () => {
      await mongoDBTransaction.start();
      await mongoDBTransaction.abort();

      expect(sessionMock.abortTransaction).to.be.calledOnce();
    });

    it('should throw an error if session is not started', async () => {
      try {
        await mongoDBTransaction.abort();

        expect.fail('should throw "Session is not started" error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidSessionError);
        expect(sessionMock.commitTransaction).to.have.not.been.called();
      }
    });
  });

  describe('#runWithTransaction', async () => {
    it('should run function with transaction', async () => {
      await mongoDBTransaction.start();
      await mongoDBTransaction.runWithTransaction(transactionFunctionMock);

      expect(transactionFunctionMock).to.be.calledOnce();
    });

    it('should catch TRANSIENT_TRANSACTION_ERROR', async () => {
      transactionFunctionMock.onFirstCall().throws({ errorLabels: ['TransientTransactionError'] });

      await mongoDBTransaction.start();
      await mongoDBTransaction.runWithTransaction(transactionFunctionMock);

      expect(transactionFunctionMock).to.be.calledTwice();
    });

    it('should throw an error', async () => {
      sessionMock.commitTransaction.throws('UnknownError');

      await mongoDBTransaction.start();

      try {
        await mongoDBTransaction.runWithTransaction(transactionFunctionMock);

        expect.fail('should throw "UnknownError"');
      } catch (error) {
        expect(transactionFunctionMock).to.be.calledOnce();
      }
    });

    it('should throw an error if session is not started', async () => {
      try {
        await mongoDBTransaction.runWithTransaction(transactionFunctionMock);

        expect.fail('should throw "Session is not started" error');
      } catch (error) {
        expect(error).to.be.an.instanceOf(InvalidSessionError);
        expect(transactionFunctionMock).to.have.not.been.called();
      }
    });
  });
});
