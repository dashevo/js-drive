const Long = require('long');

const {
  tendermint: {
    abci: {
      ResponseBeginBlock,
    },
  },
} = require('@dashevo/abci/types');

const beginBlockHandlerFactory = require('../../../../lib/abci/handlers/beginBlockHandlerFactory');

const BlockExecutionDBTransactionsMock = require('../../../../lib/test/mock/BlockExecutionStoreTransactionsMock');
const BlockExecutionContextMock = require('../../../../lib/test/mock/BlockExecutionContextMock');
const LoggerMock = require('../../../../lib/test/mock/LoggerMock');
const InternalAbciError = require('../../../../lib/abci/errors/InternalAbciError');

describe('beginBlockHandlerFactory', () => {
  let protocolVersion;
  let beginBlockHandler;
  let request;
  let blockHeight;
  let coreChainLockedHeight;
  let blockExecutionDBTransactionsMock;
  let blockExecutionContextMock;
  let previousBlockExecutionContextMock;
  let header;
  let updateSimplifiedMasternodeListMock;
  let waitForChainLockedHeightMock;
  let loggerMock;
  let lastCommitInfo;
  let dppMock;
  let transactionalDppMock;

  beforeEach(function beforeEach() {
    protocolVersion = Long.fromInt(0);

    blockExecutionDBTransactionsMock = new BlockExecutionDBTransactionsMock(this.sinon);

    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);
    previousBlockExecutionContextMock = new BlockExecutionContextMock(this.sinon);

    loggerMock = new LoggerMock(this.sinon);

    dppMock = {
      setProtocolVersion: this.sinon.stub(),
    };
    transactionalDppMock = {
      setProtocolVersion: this.sinon.stub(),
    };

    updateSimplifiedMasternodeListMock = this.sinon.stub();
    waitForChainLockedHeightMock = this.sinon.stub();

    beginBlockHandler = beginBlockHandlerFactory(
      blockExecutionDBTransactionsMock,
      blockExecutionContextMock,
      previousBlockExecutionContextMock,
      protocolVersion,
      dppMock,
      transactionalDppMock,
      updateSimplifiedMasternodeListMock,
      waitForChainLockedHeightMock,
      loggerMock,
    );

    blockHeight = 2;
    blockHeight = 1;

    header = {
      version: {
        app: protocolVersion,
      },
      height: blockHeight,
      time: {
        seconds: Math.ceil(new Date().getTime() / 1000),
      },
      coreChainLockedHeight,
    };

    lastCommitInfo = {};

    request = {
      header,
      lastCommitInfo,
    };
  });

  it('should update height, start transactions return ResponseBeginBlock', async () => {
    const response = await beginBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseBeginBlock);

    expect(blockExecutionDBTransactionsMock.start).to.be.calledOnceWithExactly();

    expect(previousBlockExecutionContextMock.reset).to.be.calledOnceWithExactly();
    expect(previousBlockExecutionContextMock.populate).to.be.calledOnceWithExactly(
      blockExecutionContextMock,
    );

    expect(blockExecutionContextMock.reset).to.be.calledOnceWithExactly();
    expect(blockExecutionContextMock.setHeader).to.be.calledOnceWithExactly(header);
    expect(blockExecutionContextMock.setLastCommitInfo).to.be.calledOnceWithExactly(lastCommitInfo);

    expect(updateSimplifiedMasternodeListMock).to.be.calledOnceWithExactly(
      coreChainLockedHeight, { logger: loggerMock },
    );
    expect(waitForChainLockedHeightMock).to.be.calledOnceWithExactly(coreChainLockedHeight);
    expect(blockExecutionDBTransactionsMock.abort).to.be.not.called();
    expect(dppMock.setProtocolVersion).to.have.been.calledOnceWithExactly(
      protocolVersion.toNumber(),
    );
    expect(transactionalDppMock.setProtocolVersion).to.have.been.calledOnceWithExactly(
      protocolVersion.toNumber(),
    );
  });

  it('should reject not supported protocol version', async () => {
    request.header.version.app = Long.fromInt(42);

    try {
      await beginBlockHandler(request);

      expect.fail('Expected exception to be thrown');
    } catch (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.equal('Block protocol version 42 not supported. Expected to be less or equal to 0.');
      expect(err.name).to.equal('NotSupportedProtocolVersionError');
    }
  });

  it('should throw an InternalABCIError in case version.app is not present', async () => {
    delete request.header.version.app;

    try {
      await beginBlockHandler(request);

      expect.fail('Expected exception to be thrown');
    } catch (err) {
      expect(err).to.be.an.instanceOf(InternalAbciError);
      expect(err.getError().message).to.equal('app version was not present in consensus parameters');
    }
  });

  it('should abort already started transactions', async () => {
    blockExecutionDBTransactionsMock.isStarted.returns(true);

    const response = await beginBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseBeginBlock);

    expect(blockExecutionDBTransactionsMock.start).to.be.calledOnceWithExactly();

    expect(previousBlockExecutionContextMock.reset).to.be.calledOnceWithExactly();
    expect(previousBlockExecutionContextMock.populate).to.be.calledOnceWithExactly(
      blockExecutionContextMock,
    );

    expect(blockExecutionContextMock.reset).to.be.calledOnceWithExactly();
    expect(blockExecutionContextMock.setHeader).to.be.calledOnceWithExactly(header);
    expect(blockExecutionContextMock.setLastCommitInfo).to.be.calledOnceWithExactly(lastCommitInfo);

    expect(updateSimplifiedMasternodeListMock).to.be.calledOnceWithExactly(
      coreChainLockedHeight, { logger: loggerMock },
    );

    expect(waitForChainLockedHeightMock).to.be.calledOnceWithExactly(coreChainLockedHeight);
    expect(blockExecutionDBTransactionsMock.abort).to.be.calledOnce();
  });
});
