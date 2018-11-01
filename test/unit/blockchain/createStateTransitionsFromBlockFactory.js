const getBlockFixtures = require('../../../lib/test/fixtures/getBlockFixtures');
const getTransitionHeaderFixtures = require('../../../lib/test/fixtures/getTransitionHeaderFixtures');

const StateTransitionHeader = require('../../../lib/blockchain/StateTransitionHeader');

const RpcClientMock = require('../../../lib/test/mock/RpcClientMock');

const createStateTransitionsFromBlockFactory = require('../../../lib/blockchain/createStateTransitionsFromBlockFactory');

describe('createStateTransitionsFromBlockFactory', () => {
  let rpcClientMock;
  let blocks;
  let transitions;
  let createStateTransitionsFromBlock;

  beforeEach(function beforeEach() {
    blocks = getBlockFixtures();
    transitions = getTransitionHeaderFixtures();
    rpcClientMock = new RpcClientMock(this.sinon);
    createStateTransitionsFromBlock = createStateTransitionsFromBlockFactory(rpcClientMock);
  });

  it('should create only state transitions from a block', async () => {
    const [someBlock] = blocks;
    const [transitionOne, transitionTwo] = transitions;

    // With a default constructor call it is a simple Transaction
    const nonStateTransitionTx = new StateTransitionHeader();

    // When instance of Transaction is passed to a Transaction constructor
    // it replaces itself. So we're using it to not construct a proper Transaction,
    // and not deal with `serialize` checks
    rpcClientMock.getRawTransaction
      .withArgs(nonStateTransitionTx.hash)
      .resolves({
        result: nonStateTransitionTx,
      });

    someBlock.tx = [
      transitionOne.hash,
      nonStateTransitionTx.hash,
      transitionTwo.hash,
    ];

    const stateTransitions = await createStateTransitionsFromBlock(someBlock);
    const stateTransitionHashes = stateTransitions.map(t => t.hash);

    expect(stateTransitionHashes).to.include(transitionOne.hash);
    expect(stateTransitionHashes).to.include(transitionTwo.hash);
    expect(stateTransitionHashes).to.not.include(nonStateTransitionTx.hash);
  });

  it('should return state transition in a sorted order', async () => {
    const [someBlock] = blocks;
    const [transitionOne, transitionTwo, transitionThree, transitionFour] = transitions;

    transitionTwo.extraPayload.hashPrevSubTx = transitionOne.hash;
    transitionThree.extraPayload.hashPrevSubTx = transitionTwo.hash;
    transitionFour.extraPayload.hashPrevSubTx = transitionThree.hash;

    rpcClientMock.getRawTransaction
      .withArgs(transitionTwo.hash)
      .resolves({
        result: transitionTwo.serialize(),
      });

    rpcClientMock.getRawTransaction
      .withArgs(transitionThree.hash)
      .resolves({
        result: transitionThree.serialize(),
      });

    rpcClientMock.getRawTransaction
      .withArgs(transitionFour.hash)
      .resolves({
        result: transitionFour.serialize(),
      });

    someBlock.tx = [
      transitionFour.hash,
      transitionOne.hash,
      transitionThree.hash,
      transitionTwo.hash,
    ];

    const stateTransitions = await createStateTransitionsFromBlock(someBlock);

    expect(stateTransitions[3].extraPayload.hashPrevSubTx).to.be.equal(stateTransitions[2].hash);
    expect(stateTransitions[2].extraPayload.hashPrevSubTx).to.be.equal(stateTransitions[1].hash);
    expect(stateTransitions[1].extraPayload.hashPrevSubTx).to.be.equal(stateTransitions[0].hash);
  });
});
