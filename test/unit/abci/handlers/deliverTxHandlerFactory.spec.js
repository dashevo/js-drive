const Long = require('long');
const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');

const GrpcError = require('@dashevo/grpc-common/lib/server/error/GrpcError');

const DashPlatformProtocol = require('@dashevo/dpp');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getDocumentFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');

const deliverTxHandlerFactory = require('../../../../lib/abci/handlers/deliverTxHandlerFactory');
const UpdateStatePromiseClientMock = require('../../../../lib/test/mock/UpdateStatePromiseClientMock');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let driveUpdateStateClient;
  let request;
  let dataContractRequest;
  let documentRequest;
  let identityRequest;
  let blockHeight;
  let blockHash;
  let dppMock;
  let blockchainStateMock;
  let identityCreateTransitionFixture;
  let documentsStateTransitionFixture;
  let stateTransitionDataContractFixture;
  let identityRepositoryMock;
  let identityFixture;
  let blockExecutionDBTransactionsMock;
  let dbTransaction;
  let dpp;
  let unserializeStateTransitionMock;

  beforeEach(function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    const documentFixture = getDocumentFixture();
    identityFixture = getIdentityFixture();

    dpp = new DashPlatformProtocol();
    documentsStateTransitionFixture = dpp.document.createStateTransition(documentFixture);
    stateTransitionDataContractFixture = dpp
      .dataContract.createStateTransition(dataContractFixture);

    identityCreateTransitionFixture = getIdentityCreateSTFixture();

    identityRepositoryMock = {
      fetch: this.sinon.stub(),
      store: this.sinon.stub(),
    };

    documentRequest = {
      tx: documentsStateTransitionFixture.serialize(),
    };

    dataContractRequest = {
      tx: stateTransitionDataContractFixture.serialize(),
    };

    identityRequest = {
      tx: identityCreateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);
    dppMock
      .stateTransition
      .createFromSerialized
      .resolves(documentsStateTransitionFixture);
    dppMock
      .stateTransition
      .createFromSerialized
      .withArgs(stateTransitionDataContractFixture.serialize())
      .resolves(stateTransitionDataContractFixture);
    dppMock
      .stateTransition
      .createFromSerialized
      .withArgs(identityCreateTransitionFixture.serialize())
      .resolves(identityCreateTransitionFixture);
    dppMock
      .stateTransition
      .validateData
      .resolves({
        isValid: this.sinon.stub().returns(true),
      });

    dppMock.identity.applyStateTransition = this.sinon.stub().returns(identityFixture);

    blockHeight = Long.fromInt(1);
    blockHash = Buffer.alloc(0);

    blockchainStateMock = {
      getLastBlockHeight: this.sinon.stub().returns(blockHeight),
    };
    driveUpdateStateClient = new UpdateStatePromiseClientMock(this.sinon);

    dbTransaction = this.sinon.stub();

    blockExecutionDBTransactionsMock = {
      getIdentityTransaction: this.sinon.stub().returns(dbTransaction),
    };

    unserializeStateTransitionMock = this.sinon.stub();

    deliverTxHandler = deliverTxHandlerFactory(
      unserializeStateTransitionMock,
      dppMock,
      driveUpdateStateClient,
      blockchainStateMock,
      identityRepositoryMock,
      blockExecutionDBTransactionsMock,
    );
  });

  it('should apply a document State Transition and return response with code 0', async () => {
    unserializeStateTransitionMock.resolves(documentsStateTransitionFixture);

    const response = await deliverTxHandler(documentRequest);

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    applyStateTransitionRequest.setBlockHeight(blockHeight.toInt());
    applyStateTransitionRequest.setBlockHash(blockHash);

    applyStateTransitionRequest.setStateTransition(
      documentsStateTransitionFixture.serialize(),
    );

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(driveUpdateStateClient.applyStateTransition).to.be.calledOnceWith(
      applyStateTransitionRequest,
    );

    expect(identityRepositoryMock.store).to.be.not.called();
    expect(identityRepositoryMock.fetch).to.be.not.called();
  });

  it('should apply a data contract State Transition and return response with code 0', async () => {
    unserializeStateTransitionMock.resolves(stateTransitionDataContractFixture);

    const response = await deliverTxHandler(dataContractRequest);

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();

    applyStateTransitionRequest.setBlockHeight(blockHeight.toInt());
    applyStateTransitionRequest.setBlockHash(blockHash);

    applyStateTransitionRequest.setStateTransition(
      stateTransitionDataContractFixture.serialize(),
    );

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(unserializeStateTransitionMock).to.be.calledOnceWith(dataContractRequest.tx);

    expect(driveUpdateStateClient.applyStateTransition).to.be.calledOnceWith(
      applyStateTransitionRequest,
    );

    expect(identityRepositoryMock.store).to.be.not.called();
    expect(identityRepositoryMock.fetch).to.be.not.called();
  });

  it('should throw InvalidArgumentAbciError if Drive Update State Client throws an invalid argument error', async () => {
    unserializeStateTransitionMock.resolves(documentsStateTransitionFixture);

    const grpcClientError = new Error();
    grpcClientError.message = 'Invalid State Transition';
    grpcClientError.code = GrpcError.CODES.INVALID_ARGUMENT;
    grpcClientError.metadata = {
      getMap() {
        return {};
      },
    };

    driveUpdateStateClient.applyStateTransition.rejects(grpcClientError);

    try {
      await deliverTxHandler(documentRequest);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal(`Invalid argument: ${grpcClientError.message}`);
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal(grpcClientError.metadata.getMap());
    }
  });

  it('should throw an error if Drive Update State Client throws any error except invalid argument', async () => {
    unserializeStateTransitionMock.resolves(documentsStateTransitionFixture);

    const grpcClientError = new Error();
    grpcClientError.message = 'Internal Error';
    grpcClientError.code = GrpcError.CODES.INTERNAL;
    grpcClientError.metadata = {
      getMap() {
        return {};
      },
    };

    driveUpdateStateClient.applyStateTransition.rejects(grpcClientError);

    try {
      await deliverTxHandler(documentRequest);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.equal(grpcClientError);
    }
  });

  it('should set identity model if ST has IDENTITY_CREATE type', async () => {
    unserializeStateTransitionMock.resolves(identityCreateTransitionFixture);

    await deliverTxHandler(identityRequest);

    expect(dppMock.stateTransition.validateData).to.be.calledOnceWithExactly(
      identityCreateTransitionFixture,
    );
    expect(identityRepositoryMock.store).to.be.calledWithExactly(identityFixture, dbTransaction);
    expect(identityRepositoryMock.fetch).to.be.calledWithExactly(
      identityCreateTransitionFixture.getIdentityId(),
      dbTransaction,
    );
    expect(driveUpdateStateClient.applyStateTransition).to.be.not.called();
  });

  it('should throw an error on invalid data in identity state transition', async function it() {
    unserializeStateTransitionMock.resolves(identityCreateTransitionFixture);

    dppMock
      .stateTransition
      .validateData
      .resolves({
        isValid: this.sinon.stub().returns(false),
        getErrors: this.sinon.stub(),
      });

    try {
      await deliverTxHandler(identityRequest);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Invalid Identity Create Transition');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw an error with unknown state transition type', async function it() {
    unserializeStateTransitionMock.resolves(documentsStateTransitionFixture);

    documentsStateTransitionFixture.getType = this.sinon.stub().returns(42);

    request = {
      tx: documentsStateTransitionFixture.serialize(),
    };

    try {
      await deliverTxHandler(request);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: Unknown State Transition');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
