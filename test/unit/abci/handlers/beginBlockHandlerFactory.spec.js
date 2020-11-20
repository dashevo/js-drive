const Long = require('long');

const {
  abci: {
    ResponseBeginBlock,
  },
} = require('abci/types');

const beginBlockHandlerFactory = require('../../../../lib/abci/handlers/beginBlockHandlerFactory');

const ChainInfo = require('../../../../lib/chainInfo/ChainInfo');
const BlockExecutionDBTransactionsMock = require('../../../../lib/test/mock/BlockExecutionDBTransactionsMock');
const BlockExecutionContextMock = require('../../../../lib/test/mock/BlockExecutionContextMock');

describe('beginBlockHandlerFactory', () => {
  let protocolVersion;
  let beginBlockHandler;
  let request;
  let chainInfo;
  let blockHeight;
  let blockExecutionDBTransactionsMock;
  let blockExecutionContextMock;
  let updateMongoDbFromStoreTransactionMock;
  let createDocumentDbFromStoreTransactionMock;
  let header;
  let previousIdentitiesTransactionMock;
  let previousDocumentsDbTransactionMock;
  let previousDataContractsTransactionMock;
  let previousPublicKeyToIdentityIdTransactionMock;

  beforeEach(function beforeEach() {
    chainInfo = new ChainInfo();

    protocolVersion = Long.fromInt(0);

    previousIdentitiesTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
    };
    previousDocumentsDbTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
    };
    previousDataContractsTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
    };
    previousPublicKeyToIdentityIdTransactionMock = {
      commit: this.sinon.stub(),
      start: this.sinon.stub(),
    };

    blockExecutionDBTransactionsMock = new BlockExecutionDBTransactionsMock(this.sinon);
    blockExecutionDBTransactionsMock.getPreviousTransactions.returns({
      identity: previousIdentitiesTransactionMock,
      document: previousDocumentsDbTransactionMock,
      dataContract: previousDataContractsTransactionMock,
      publicKeyToIdentityId: previousPublicKeyToIdentityIdTransactionMock,
    });

    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);

    updateMongoDbFromStoreTransactionMock = this.sinon.stub();
    createDocumentDbFromStoreTransactionMock = this.sinon.stub();

    const loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
    };

    beginBlockHandler = beginBlockHandlerFactory(
      chainInfo,
      blockExecutionDBTransactionsMock,
      blockExecutionContextMock,
      updateMongoDbFromStoreTransactionMock,
      createDocumentDbFromStoreTransactionMock,
      protocolVersion,
      loggerMock,
    );

    blockHeight = 2;

    header = {
      version: {
        App: protocolVersion,
      },
      height: blockHeight,
      time: {
        seconds: Math.ceil(new Date().getTime() / 1000),
      },
    };

    request = {
      header,
    };
  });

  it('should update height, start transactions return ResponseBeginBlock', async () => {
    const response = await beginBlockHandler(request);

    expect(response).to.be.an.instanceOf(ResponseBeginBlock);

    expect(chainInfo.getLastBlockHeight()).to.equal(blockHeight);
    expect(blockExecutionDBTransactionsMock.start).to.be.calledOnce();
    expect(blockExecutionContextMock.reset).to.be.calledOnce();
    expect(blockExecutionContextMock.setHeader).to.be.calledOnceWithExactly(header);

    expect(previousIdentitiesTransactionMock.start).to.be.calledOnce();
    expect(previousIdentitiesTransactionMock.commit).to.be.calledOnce();

    expect(previousDocumentsDbTransactionMock.start).to.be.calledOnce();
    expect(previousDocumentsDbTransactionMock.commit).to.be.calledOnce();

    expect(previousDataContractsTransactionMock.start).to.be.calledOnce();
    expect(previousDataContractsTransactionMock.commit).to.be.calledOnce();

    expect(previousPublicKeyToIdentityIdTransactionMock.start).to.be.calledOnce();
    expect(previousPublicKeyToIdentityIdTransactionMock.commit).to.be.calledOnce();

    expect(createDocumentDbFromStoreTransactionMock).to.be.calledOnce();
    expect(updateMongoDbFromStoreTransactionMock).to.be.calledOnce();
  });

  it('should reject not supported protocol version', async () => {
    request.header.version.App = Long.fromInt(42);

    try {
      await beginBlockHandler(request);

      expect.fail('Expected exception to be thrown');
    } catch (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.equal('Block protocol version 42 not supported. Expected to be less or equal to 0.');
      expect(err.name).to.equal('NotSupportedProtocolVersionError');
    }
  });
});
