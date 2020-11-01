const {
  abci: {
    ResponseCommit,
  },
} = require('abci/types');

const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');

const commitHandlerFactory = require('../../../../lib/abci/handlers/commitHandlerFactory');

const BlockExecutionDBTransactionsMock = require('../../../../lib/test/mock/BlockExecutionDBTransactionsMock');
const BlockExecutionStateMock = require('../../../../lib/test/mock/BlockExecutionStateMock');

describe('commitHandlerFactory', () => {
  let commitHandler;
  let appHash;
  let chainInfoRepositoryMock;
  let blockExecutionDBTransactionsMock;
  let blockExecutionStateMock;
  let documentsDatabaseManagerMock;
  let dataContract;
  let chainInfoMock;
  let accumulativeFees;

  beforeEach(function beforeEach() {
    appHash = Buffer.alloc(0);

    chainInfoMock = {
      setLastBlockAppHash: this.sinon.stub(),
      setCreditsDistributionPool: this.sinon.stub(),
    };

    dataContract = getDataContractFixture();

    chainInfoRepositoryMock = {
      store: this.sinon.stub(),
    };

    blockExecutionDBTransactionsMock = new BlockExecutionDBTransactionsMock(this.sinon);
    blockExecutionStateMock = new BlockExecutionStateMock(this.sinon);

    blockExecutionStateMock.getDataContracts.returns([dataContract]);
    blockExecutionStateMock.getAccumulativeFees.returns(accumulativeFees);
    blockExecutionStateMock.getHeader.returns({
      height: 42,
    });

    documentsDatabaseManagerMock = {
      create: this.sinon.stub(),
      drop: this.sinon.stub(),
    };

    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    commitHandler = commitHandlerFactory(
      chainInfoMock,
      chainInfoRepositoryMock,
      blockExecutionDBTransactionsMock,
      blockExecutionStateMock,
      documentsDatabaseManagerMock,
      loggerMock,
    );
  });

  it('should commit db transactions, update chain info, create document dbs and return ResponseCommit', async () => {
    const response = await commitHandler();

    expect(response).to.be.an.instanceOf(ResponseCommit);
    expect(response.data).to.deep.equal(appHash);

    expect(blockExecutionStateMock.getDataContracts).to.be.calledOnce();

    expect(documentsDatabaseManagerMock.create).to.be.calledOnceWith(dataContract);

    expect(blockExecutionDBTransactionsMock.commit).to.be.calledOnce();

    expect(chainInfoMock.setLastBlockAppHash).to.be.calledOnceWith(appHash);

    expect(chainInfoMock.setCreditsDistributionPool).to.be.calledOnceWith(accumulativeFees);

    expect(blockExecutionStateMock.getAccumulativeFees).to.be.calledOnce();

    expect(chainInfoRepositoryMock.store).to.be.calledOnceWith(chainInfoMock);
    expect(blockExecutionStateMock.reset).to.be.calledOnce();
  });

  it('should throw error and abort DB transactions if can\'t store chain info', async () => {
    const error = new Error('Some error');

    chainInfoRepositoryMock.store.throws(error);

    try {
      await commitHandler();

      expect.fail('should throw error');
    } catch (e) {
      expect(e).to.equal(error);

      expect(blockExecutionDBTransactionsMock.abort).to.be.calledOnce();
      expect(documentsDatabaseManagerMock.drop).to.be.calledOnceWith(dataContract);
      expect(blockExecutionStateMock.reset).to.be.calledOnce();
    }
  });
});
