const applyStateTransitionFromReferenceFactory = require('../../../lib/stateView/applyStateTransitionFromReferenceFactory');

const getReferenceFixture = require('../../../lib/test/fixtures/getReferenceFixture');
const getBlockFixtures = require('../../../lib/test/fixtures/getBlocksFixture');
const getTransitionFixtures = require('../../../lib/test/fixtures/getStateTransitionsFixture');

describe('applyStateTransitionFromReferenceFactory', () => {
  let applyStateTransition;
  let applyStateTransitionFromReference;

  beforeEach(function beforeEach() {
    applyStateTransition = this.sinon.stub();

    applyStateTransitionFromReference = applyStateTransitionFromReferenceFactory(
      applyStateTransition,
    );
  });

  it('should call RPC methods and applyStateTransition with proper arguments', async () => {
    const [block] = getBlockFixtures();
    const [stateTransition] = getTransitionFixtures();

    const reference = getReferenceFixture();

    await applyStateTransitionFromReference(reference);

    expect(applyStateTransition).to.have.been.calledOnceWith(stateTransition, block);
  });
});
