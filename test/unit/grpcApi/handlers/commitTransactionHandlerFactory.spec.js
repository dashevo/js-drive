const { CommitTransactionResponse, CommitTransactionRequest } = require('@dashevo/drive-grpc');

const commitTransactionHandlerFactory = require('../../../../lib/grpcApi/handlers/commitTransactionHandlerFactory');
const GrpcCallMock = require('../../../../lib/test/mock/GrpcCallMock');
const InternalGrpcError = require('../../../../lib/grpcApi/error/InternalGrpcError');
const BlockExecutionState = require('../../../../lib/grpcApi/BlockExecutionState');
const getMongoClientMock = require('../../../../lib/test/mock/getMongoClientMock');
const MongoDBTransaction = require('../../../../lib/mongoDb/MongoDBTransaction');
const FailedPreconditionGrpcError = require('../../../../lib/grpcApi/error/FailedPreconditionGrpcError');
const getSVContractFixture = require('../../../../lib/test/fixtures/getSVContractFixture');

describe('commitTransactionHandlerFactory', () => {
  let commitTransactionHandler;
  let request;
  let call;
  let mongoDBTransaction;
  let createContractDatabaseMock;
  let blockExecutionState;

  beforeEach(function beforeEach() {
    const mongoClientMock = getMongoClientMock(this.sinon);
    blockExecutionState = new BlockExecutionState();
    const removeContractDatabaseMock = this.sinon.stub();

    blockExecutionState.addContract(getSVContractFixture());
    createContractDatabaseMock = this.sinon.stub();
    mongoDBTransaction = new MongoDBTransaction(mongoClientMock);

    commitTransactionHandler = commitTransactionHandlerFactory(
      mongoDBTransaction,
      createContractDatabaseMock,
      removeContractDatabaseMock,
      blockExecutionState,
    );

    request = new CommitTransactionRequest();
    request.getBlockHash = this.sinon.stub().returns('hash');

    call = new GrpcCallMock(this.sinon, request);
    mongoDBTransaction.start();
  });

  it('should throw InternalGrpcError if error on write to DB happens ', async () => {
    createContractDatabaseMock.throws(new Error('Transaction is not started'));

    try {
      await commitTransactionHandler(call);
      expect.fail('should throw an InvalidArgumentGrpcError error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(InternalGrpcError);
      expect(error.getMessage()).to.equal('Internal error');
      expect(error.getError().message).to.equal('Transaction is not started');
    }
  });

  it('should throw FailedPreconditionGrpcError is transaction was not started', async () => {
    await mongoDBTransaction.abort();

    try {
      await commitTransactionHandler(call);
      expect.fail('should throw an FailedPreconditionGrpcError error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(FailedPreconditionGrpcError);
      expect(error.getMessage()).to.equal('Failed precondition: Transaction is not started');
    }
  });

  it('should return valid result', async () => {
    const response = await commitTransactionHandler(call);

    expect(response).to.be.an.instanceOf(CommitTransactionResponse);
    expect(blockExecutionState.getContracts()).to.have.lengthOf(0);
  });
});
