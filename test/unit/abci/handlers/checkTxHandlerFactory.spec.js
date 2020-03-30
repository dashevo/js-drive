const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const DashPlatformProtocol = require('@dashevo/dpp');

const getDocumentFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');

const level = require('level-rocksdb');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let request;
  let stateTransitionFixture;
  let db;
  let unserializeStateTransitionMock;

  beforeEach(function beforeEach() {
    const dpp = new DashPlatformProtocol();
    const documentFixture = getDocumentFixture();

    stateTransitionFixture = dpp.document.createStateTransition({
      create: documentFixture,
    });

    request = {
      tx: stateTransitionFixture.serialize(),
    };

    unserializeStateTransitionMock = this.sinon.stub()
      .resolves(stateTransitionFixture);

    checkTxHandler = checkTxHandlerFactory(
      unserializeStateTransitionMock,
    );

    db = level('./db/state-test', { valueEncoding: 'binary' });
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  it('should validate a State Transition and return response with code 0', async () => {
    const response = await checkTxHandler(request);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(unserializeStateTransitionMock).to.be.calledOnceWith(request.tx);
  });
});
