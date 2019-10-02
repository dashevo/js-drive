const { StartTransactionResponse } = require('@dashevo/drive-grpc');
const startTransactionHandlerFactory = require('../../../../lib/grpcApi/handlers/startTransactionHandlerFactory');
const FailedPreconditionGrpcError = require('../../../../lib/grpcApi/error/FailedPreconditionGrpcError');
const MongoDBTransaction = require('../../../../lib/mongoDb/MongoDBTransaction');
const GrpcCallMock = require('../../../../lib/test/mock/GrpcCallMock');
const getMongoClientMock = require('../../../../lib/test/mock/getMongoClientMock');

describe('startTransactionHandlerFactory', () => {
  let startTransactionHandler;
  let call;
  let mongoDBTransaction;

  beforeEach(function beforeEach() {
    const mongoClientMock = getMongoClientMock(this.sinon);
    mongoDBTransaction = new MongoDBTransaction(mongoClientMock);
    startTransactionHandler = startTransactionHandlerFactory(mongoDBTransaction);
    call = new GrpcCallMock(this.sinon, {});
  });

  it('should throw an error if transaction is not started', async () => {
    mongoDBTransaction.start();

    try {
      await startTransactionHandler(call);
      expect.fail('should throw an error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(FailedPreconditionGrpcError);
      expect(error.getMessage()).to.equal('Failed precondition: TransactionIsAlreadyStartedError: Transaction is already started');
    }
  });

  it('should return valid result', async () => {
    const response = await startTransactionHandler(call);

    expect(response).to.be.an.instanceOf(StartTransactionResponse);
  });
});
