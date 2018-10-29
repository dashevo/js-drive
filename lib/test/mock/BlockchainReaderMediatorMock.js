const Emittery = require('emittery');

class BlockchainReaderMediatorMock extends Emittery {
  constructor(sinonSandbox) {
    super();

    this.state = {
      getBlocks: sinonSandbox.stub(),
      getBlocksLimit: sinonSandbox.stub(),
      getLastBlock: sinonSandbox.stub(),
      removeLastBlock: sinonSandbox.stub(),
      getFirstBlockHeight: sinonSandbox.stub(),
    };

    this.reset = sinonSandbox.stub();
    this.getInitialBlockHeight = sinonSandbox.stub();

    const classMethods = Object.getPrototypeOf(this);
    const emitteryMethods = Object.getPrototypeOf(classMethods);

    this.emitSerial = sinonSandbox.stub();
    this.originalEmitSerial = emitteryMethods.emitSerial.bind(this);
  }

  getState() {
    return this.state;
  }
}

module.exports = BlockchainReaderMediatorMock;
