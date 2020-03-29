const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

const {
  CommitTransactionRequest,
} = require('@dashevo/drive-grpc');
const Long = require('long');

const commitHandlerFactory = require('../../../../lib/abci/handlers/commitHandlerFactory');

const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

const BlockchainState = require('../../../../lib/state/BlockchainState');

describe('commitHandlerFactory', () => {
  let commitHandler;
  let driveUpdateStateClientMock;
  let blockHeight;
  let blockHash;
  let appHash;
  let blockchainStateRepositoryMock;
  let identityRepositoryMock;

  beforeEach(function beforeEach() {
    blockHeight = Long.fromInt(42);
    blockHash = Buffer.alloc(0);
    appHash = Buffer.alloc(0);

    const blockchainState = new BlockchainState(blockHeight, appHash);

    driveUpdateStateClientMock = new UpdateStatePromiseClientMock(this.sinon);

    blockchainStateRepositoryMock = {
      store: this.sinon.stub(),
    };

    identityRepositoryMock = {
      commit: this.sinon.stub(),
    };

    commitHandler = commitHandlerFactory(
      driveUpdateStateClientMock,
      blockchainState,
      blockchainStateRepositoryMock,
      identityRepositoryMock,
    );
  });

  it('should commit transaction and return ResponseCommit', async () => {
    const response = await commitHandler();

    expect(response).to.be.an.instanceOf(ResponseCommit);
    expect(response.data).to.deep.equal(appHash);

    const commitTransactionRequest = new CommitTransactionRequest();
    commitTransactionRequest.setBlockHeight(blockHeight.toInt());
    commitTransactionRequest.setBlockHash(blockHash);

    expect(driveUpdateStateClientMock.commitTransaction).to.be.calledOnceWith(
      commitTransactionRequest,
    );

    expect(blockchainStateRepositoryMock.store).to.be.calledOnce();

    const blockchainState = blockchainStateRepositoryMock.store.getCall(0).args[0];

    expect(blockchainState).to.be.an.instanceOf(BlockchainState);
    expect(blockchainState.getLastBlockHeight()).to.equal(blockHeight);
    expect(blockchainState.getLastBlockAppHash()).to.deep.equal(appHash);

    expect(identityRepositoryMock.commit).to.be.calledOnce();
  });
});
