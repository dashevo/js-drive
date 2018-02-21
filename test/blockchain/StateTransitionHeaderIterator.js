/* eslint-disable import/no-extraneous-dependencies,no-cond-assign,no-await-in-loop */

const fs = require('fs');
const path = require('path');

const { expect } = require('chai');

const StateTransitionHeaderIterator = require('../../lib/blockchain/StateTransitionHeaderIterator');
const StateTransitionHeader = require('../../lib/blockchain/StateTransitionHeader');

const blocksJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/blocks.json'));
const blocks = JSON.parse(blocksJSON);

const transitionHeadersJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/stateTransitionHeaders.json'));
const transitionHeaders = JSON.parse(transitionHeadersJSON);

let currentBlockIndex = 0;
const blockIteratorMock = {
  rpcClient: {
    getTransitionHeader(tsid, callback) {
      callback(null, { result: transitionHeaders.find(header => header.tsid === tsid) });
    },
  },
  async next() {
    if (!blocks[currentBlockIndex]) {
      return Promise.resolve({ done: true });
    }

    const currentBlock = blocks[currentBlockIndex];

    currentBlockIndex++;

    return Promise.resolve({ done: false, value: currentBlock });
  },
};


describe('StateTransitionHeaderIterator', () => {
  it('should iterate over State Transitions from BlockIterator', async () => {
    const obtainedHeaders = [];

    const stateTransitionHeaderIterator = new StateTransitionHeaderIterator(blockIteratorMock);

    let done;
    let header;

    while ({ done, value: header } = await stateTransitionHeaderIterator.next()) {
      if (done) {
        break;
      }

      obtainedHeaders.push(header);
    }

    const transitionHeaderObjects = transitionHeaders.map(h => new StateTransitionHeader(h));
    expect(obtainedHeaders).to.be.deep.equal(transitionHeaderObjects);
  });
});
