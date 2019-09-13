const { CommitTransactionResponse, CommitTransactionRequest } = require('@dashevo/drive-grpc');

const commitTransactionHandlerFactory = require('../../../../lib/grpcApi/handlers/commitTransactionHandlerFactory');
const GrpcCallMock = require('../../../../lib/test/mock/GrpcCallMock');
const InvalidArgumentGrpcError = require('../../../../lib/grpcApi/error/InvalidArgumentGrpcError');
const InternalGrpcError = require('../../../../lib/grpcApi/error/InternalGrpcError');

describe('commitTransactionHandlerFactory', () => {
  let commitTransactionHandler;
  let request;
  let call;
  let mongoDBTransaction;

  beforeEach(function beforeEach() {
    mongoDBTransaction = {
      commit: this.sinon.stub(),
      abort: this.sinon.stub(),
    };

    const createContractDatabaseMock = this.sinon.stub();
    const removeContractDatabaseMock = this.sinon.stub();

    const svContractMongoDbRepositoryMock = {
      findAllByReferenceSTHash: this.sinon.stub().resolves(['fakeContact']),
    };

    commitTransactionHandler = commitTransactionHandlerFactory(
      mongoDBTransaction,
      svContractMongoDbRepositoryMock,
      createContractDatabaseMock,
      removeContractDatabaseMock,
    );

    request = new CommitTransactionRequest();
    request.getBlockHash = this.sinon.stub().returns('hash');

    call = new GrpcCallMock(this.sinon, request);
  });

  it('should throw InvalidArgumentGrpcError when blockHash param is missed', async () => {
    request.getBlockHash.returns(null);

    try {
      await commitTransactionHandler(call);
      expect.fail('should throw an InvalidArgumentGrpcError error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(InvalidArgumentGrpcError);
      expect(error.message).to.be.equal('Invalid argument: blockHash is not specified');
    }
  });

  it('should throw InternalGrpcError if error on commit happens ', async () => {
    mongoDBTransaction.commit.throws(new Error('Transaction is not started'));

    try {
      await commitTransactionHandler(call);
      expect.fail('should throw an InvalidArgumentGrpcError error');
    } catch (error) {
      expect(error).to.be.an.instanceOf(InternalGrpcError);
      expect(error.getMessage()).to.equal('Internal error');
      expect(error.getError().message).to.equal('Transaction is not started');
    }
  });

  it('should return valid result', async () => {
    const response = await commitTransactionHandler(call);

    expect(response).to.be.an.instanceOf(CommitTransactionResponse);
  });
});
