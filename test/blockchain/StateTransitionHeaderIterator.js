/* eslint-disable import/no-extraneous-dependencies,no-cond-assign,no-await-in-loop */

const fs = require('fs');
const path = require('path');

const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

use(sinonChai);

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
  let getTransitionHeaderSpy;
  let nextSpy;

  beforeEach(function beforeEach() {
    if (!this.sinon) {
      this.sinon = sinon.sandbox.create();
    } else {
      this.sinon.restore();
    }

    getTransitionHeaderSpy = this.sinon.spy(blockIteratorMock.rpcClient, 'getTransitionHeader');
    nextSpy = this.sinon.spy(blockIteratorMock, 'next');
  });

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

    expect(getTransitionHeaderSpy).has.callCount(transitionHeaders.length);
    expect(nextSpy).has.callCount(blocks.length + 1);

    const transitionHeaderObjects = transitionHeaders.map(h => new StateTransitionHeader(h));
    expect(obtainedHeaders).to.be.deep.equal(transitionHeaderObjects);
  });
});
