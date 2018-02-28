const fs = require('fs');
const path = require('path');

const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

use(sinonChai);

const addStateTransitionsFromBlockchain = require('../../lib/storage/addStateTransitionsFromBlockchain');
const StateTransitionHeader = require('../../lib/blockchain/StateTransitionHeader');
const StateTransitionHeaderIterator = require('../../lib/blockchain/StateTransitionHeaderIterator');
const WrongBlocksSequenceError = require('../../lib/blockchain/WrongBlocksSequenceError');


describe('addStateTransitionsFromBlockchain', () => {
  let blocks;
  let transitionHeaders;
  let ipfsAPIMock;
  let stateTransitionHeaderIteratorMock;
  let currentHeaderIndex;
  let nextStab;
  let setStubsWithErrorOnSecondBlock;

  beforeEach(function beforeEach() {
    if (!this.sinon) {
      this.sinon = sinon.sandbox.create();
    } else {
      this.sinon.restore();
    }

    const blocksJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/blocks.json'));
    blocks = JSON.parse(blocksJSON);

    const transitionHeadersJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/stateTransitionHeaders.json'));
    const transitionHeadersData = JSON.parse(transitionHeadersJSON);
    transitionHeaders = transitionHeadersData.map(header => new StateTransitionHeader(header));

    // Mock IPFS API
    class IpfsAPI {
      constructor() {
        this.pin = {};
      }
    }

    ipfsAPIMock = new IpfsAPI();
    ipfsAPIMock.pin.add = this.sinon.spy();

    // Mock StateTransitionHeaderIterator
    const blockIteratorMock = {
      rpcClient: {
        getTransitionHeader: this.sinon.stub(),
      },
      getBlockHeight: this.sinon.stub(),
      setBlockHeight: this.sinon.stub(),
      reset: this.sinon.stub(),
    };
    stateTransitionHeaderIteratorMock = new StateTransitionHeaderIterator(blockIteratorMock);

    nextStab = this.sinon.stub(stateTransitionHeaderIteratorMock, 'next');
    currentHeaderIndex = 0;
    nextStab.callsFake(() => {
      if (!transitionHeaders[currentHeaderIndex]) {
        return Promise.resolve({ done: true });
      }

      const currentHeader = transitionHeaders[currentHeaderIndex];

      currentHeaderIndex++;

      return Promise.resolve({ done: false, value: currentHeader });
    });

    setStubsWithErrorOnSecondBlock = function setNextStubWithError() {
      blockIteratorMock.getBlockHeight.returns(blocks[1].height);

      let throwErrorOnSecondBlock = true;
      nextStab.callsFake(() => {
        if (!transitionHeaders[currentHeaderIndex]) {
          return Promise.resolve({ done: true });
        }

        if (currentHeaderIndex === blocks[0].ts.length && throwErrorOnSecondBlock) {
          throwErrorOnSecondBlock = false;

          throw new WrongBlocksSequenceError();
        }

        const currentHeader = transitionHeaders[currentHeaderIndex];

        currentHeaderIndex++;

        return Promise.resolve({ done: false, value: currentHeader });
      });
    };

    const resetStab = this.sinon.stub(stateTransitionHeaderIteratorMock, 'reset');
    resetStab.callsFake(() => {
      currentHeaderIndex = 0;
    });
  });

  it('should pin ST packets by hash from ST headers from blockchain', async () => {
    await addStateTransitionsFromBlockchain(ipfsAPIMock, stateTransitionHeaderIteratorMock);

    expect(nextStab).has.callCount(transitionHeaders.length + 1);

    expect(ipfsAPIMock.pin.add).has.callCount(transitionHeaders.length);

    transitionHeaders.forEach((header) => {
      expect(ipfsAPIMock.pin.add).to.be.calledWith(header.storageHash, { recursive: true });
    });
  });

  it('should pin ST packets again since stable block if blocks sequence is wrong', async () => {
    // Stub of "next" method should throws WrongBlocksSequenceError on second block
    setStubsWithErrorOnSecondBlock();

    await addStateTransitionsFromBlockchain(ipfsAPIMock, stateTransitionHeaderIteratorMock);

    // nextStab calls transitionHeaders.length + from from first block + error + last one empty
    expect(nextStab).has.callCount(transitionHeaders.length + blocks[0].ts.length + 2);

    // Pin add calls transitionHeaders.length + from first blocks
    expect(ipfsAPIMock.pin.add).has.callCount(transitionHeaders.length + blocks[0].ts.length);

    // Copy headers and duplicate headers from first block
    const transitionHeadersWithDuplicate = transitionHeaders.slice();
    // eslint-disable-next-line arrow-body-style
    const tsHeadersFromFirstTwoBlocks = blocks[0].ts.map((tsid) => {
      return transitionHeaders.find(h => h.tsid === tsid);
    });

    transitionHeadersWithDuplicate.unshift(...tsHeadersFromFirstTwoBlocks);

    transitionHeadersWithDuplicate.forEach((header) => {
      expect(ipfsAPIMock.pin.add).to.be.calledWith(header.storageHash, { recursive: true });
    });
  });
});
