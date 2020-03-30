const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const DashPlatformProtocol = require('@dashevo/dpp');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const getIdentityFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityFixture');
const getDataContractFixture = require('@dashevo/dpp/lib/test/fixtures/getDataContractFixture');
const getDocumentFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');
const BlockExecutionStateMock = require('../../../../lib/test/mock/BlockExecutionStateMock');
const ValidationResult = require('../../../../lib/document/query/ValidationResult');

const deliverTxHandlerFactory = require('../../../../lib/abci/handlers/deliverTxHandlerFactory');

const InvalidArgumentAbciError = require('../../../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../../../lib/abci/errors/AbciError');
const ValidationError = require('../../../../lib/document/query/errors/ValidationError');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let dataContractRequest;
  let documentRequest;
  let dppMock;
  let documentsStateTransitionFixture;
  let dataContractStateTransitionFixture;
  let identityFixture;
  let dpp;
  let unserializeStateTransitionMock;
  let blockExecutionStateMock;

  beforeEach(function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    const documentFixture = getDocumentFixture();
    identityFixture = getIdentityFixture();

    dpp = new DashPlatformProtocol();
    documentsStateTransitionFixture = dpp.document.createStateTransition({
      create: documentFixture,
    });

    dataContractStateTransitionFixture = dpp
      .dataContract.createStateTransition(dataContractFixture);

    documentRequest = {
      tx: documentsStateTransitionFixture.serialize(),
    };

    dataContractRequest = {
      tx: dataContractStateTransitionFixture.serialize(),
    };

    dppMock = createDPPMock(this.sinon);

    dppMock
      .stateTransition
      .validateData
      .resolves({
        isValid: this.sinon.stub().returns(true),
      });

    // @TODO add this to DPP
    dppMock
      .stateTransition
      .updateState = this.sinon
        .stub();

    dppMock.identity.applyStateTransition = this.sinon.stub().returns(identityFixture);

    unserializeStateTransitionMock = this.sinon.stub();

    blockExecutionStateMock = new BlockExecutionStateMock(this.sinon);

    deliverTxHandler = deliverTxHandlerFactory(
      unserializeStateTransitionMock,
      dppMock,
      blockExecutionStateMock,
    );
  });

  it('should apply a document State Transition and return response with code 0', async () => {
    unserializeStateTransitionMock.resolves(documentsStateTransitionFixture);

    const response = await deliverTxHandler(documentRequest);

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(unserializeStateTransitionMock).to.be.calledOnceWith(
      documentsStateTransitionFixture.serialize(),
    );
    expect(dppMock.stateTransition.validateData).to.be.calledOnceWith(
      documentsStateTransitionFixture,
    );
    expect(dppMock.stateTransition.updateState).to.be.calledOnceWith(
      documentsStateTransitionFixture,
    );
    expect(blockExecutionStateMock.addDataContract).to.not.be.called();
  });

  it('should apply a data contract State Transition and return response with code 0', async () => {
    unserializeStateTransitionMock.resolves(dataContractStateTransitionFixture);

    const response = await deliverTxHandler(dataContractRequest);

    expect(response).to.be.an.instanceOf(ResponseDeliverTx);
    expect(response.code).to.equal(0);

    expect(unserializeStateTransitionMock).to.be.calledOnceWith(
      dataContractStateTransitionFixture.serialize(),
    );
    expect(dppMock.stateTransition.validateData).to.be.calledOnceWith(
      dataContractStateTransitionFixture,
    );
    expect(dppMock.stateTransition.updateState).to.be.calledOnceWith(
      dataContractStateTransitionFixture,
    );
    expect(blockExecutionStateMock.addDataContract).to.be.calledOnceWith(
      dataContractStateTransitionFixture.getDataContract(),
    );
  });

  it('should throw InvalidArgumentAbciError if in invalid state transition', async () => {
    unserializeStateTransitionMock.resolves(dataContractStateTransitionFixture);

    const error = new ValidationError('Some error');

    const invalidResult = new ValidationResult([error]);
    dppMock.stateTransition.validateData.resolves(invalidResult);

    try {
      await deliverTxHandler(documentRequest);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid state transition');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal({ errors: [error] });
    }
  });
});
