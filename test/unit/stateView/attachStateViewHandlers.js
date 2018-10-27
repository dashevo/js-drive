const Emittery = require('emittery');

const ReaderMediator = require('../../../lib/blockchain/reader/BlockchainReaderMediator');

const attachStateViewHandlers = require('../../../lib/stateView/attachStateViewHandlers');

const getTransitionHeaderFixtures = require('../../../lib/test/fixtures/getTransitionHeaderFixtures');
const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');

describe('attachStateViewHandlers', () => {
  let readerMediator;
  let applyStateTransition;
  let dropMongoDatabasesWithPrefixStub;
  let mongoDbPrefix;

  beforeEach(function beforeEach() {
    readerMediator = new Emittery();
    applyStateTransition = this.sinon.stub();
    dropMongoDatabasesWithPrefixStub = this.sinon.stub();
    mongoDbPrefix = 'test';

    attachStateViewHandlers(
      readerMediator,
      applyStateTransition,
      dropMongoDatabasesWithPrefixStub,
      mongoDbPrefix,
    );
  });

  it('should call applyStateTransition on the state transition event', async () => {
    const [stateTransition] = getTransitionHeaderFixtures();
    const [block] = getBlockFixtures();

    await readerMediator.emitSerial(ReaderMediator.EVENTS.STATE_TRANSITION, {
      stateTransition,
      block,
    });

    expect(applyStateTransition).to.be.calledOnce();
    expect(applyStateTransition).to.be.calledWith(stateTransition, block);
  });

  it('should call dropMongoDatabasesWithPrefix on the reset event', async () => {
    await readerMediator.emit(ReaderMediator.EVENTS.RESET);

    expect(dropMongoDatabasesWithPrefixStub).to.be.calledOnce();
    expect(dropMongoDatabasesWithPrefixStub).to.be.calledWith(mongoDbPrefix);
  });
});
