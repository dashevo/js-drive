const MongoDBTransaction = require('../../../lib/mongoDb/MongoDBTransaction');

describe('MongoDBTransaction', () => {
  let mongoClientMock;
  let mongoDBTransaction;
  let sessionMock;
  let txFuncMock;

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
    txFuncMock = this.sinon.stub().resolves(this.sinon.stub());
  });

  describe('start', () => {
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
        expect(mongoClientMock.startSession).to.be.calledOnce();
        expect(sessionMock.startTransaction).to.be.calledOnce();
      }
    });
  });

  describe('commit', () => {
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
        expect(sessionMock.commitTransaction).to.have.not.been.called();
      }
    });


    it('should catch UnknownTransactionCommitResult error', async () => {
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

  describe('abort', () => {
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
        expect(sessionMock.commitTransaction).to.have.not.been.called();
      }
    });
  });

  describe('getSession', () => {
    it('should return session', async () => {
      let session = mongoDBTransaction.getSession();

      expect(session).to.be.a('null');

      await mongoDBTransaction.start();
      session = mongoDBTransaction.getSession();

      expect(session).to.be.deep.equal(sessionMock);
    });
  });

  describe('runWithTransaction', async () => {
    it('should run function with transaction', async () => {
      await mongoDBTransaction.start();
      await mongoDBTransaction.runWithTransaction(txFuncMock);

      expect(txFuncMock).to.be.calledOnce();
    });

    it('should catch TransientTransactionError', async () => {
      txFuncMock.onFirstCall().throws({ errorLabels: ['TransientTransactionError'] });

      await mongoDBTransaction.start();
      await mongoDBTransaction.runWithTransaction(txFuncMock);

      expect(txFuncMock).to.be.calledTwice();
    });

    it('should throw an error', async () => {
      sessionMock.commitTransaction.throws('UnknownError');

      await mongoDBTransaction.start();

      try {
        await mongoDBTransaction.runWithTransaction(txFuncMock);

        expect.fail('should throw "UnknownError"');
      } catch (error) {
        expect(txFuncMock).to.be.calledOnce();
      }
    });

    it('should throw an error if session is not started', async () => {
      try {
        await mongoDBTransaction.runWithTransaction(txFuncMock);

        expect.fail('should throw "Session is not started" error');
      } catch (error) {
        expect(txFuncMock).to.have.not.been.called();
      }
    });
  });
});
