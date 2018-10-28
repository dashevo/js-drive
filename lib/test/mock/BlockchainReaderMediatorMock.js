const Emittery = require('emittery');

class BlockchainReaderMediatorMock extends Emittery {
  constructor(sinon) {
    super();

    this.state = {
      getBlocksLimit: sinon.stub(),
      getLastBlock: sinon.stub(),
      removeLastBlock: sinon.stub(),
    };

    this.reset = sinon.stub();
    this.getInitialBlockHeight = sinon.stub();
  }

  getState() {
    return this.state;
  }
}

module.exports = BlockchainReaderMediatorMock;
