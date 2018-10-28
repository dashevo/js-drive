const Emittery = require('emittery');

let originalEmitSerial;

class BlockchainReaderMediatorMock extends Emittery {
  constructor(sinonSandbox) {
    super();

    this.state = {
      getBlocksLimit: sinonSandbox.stub(),
      getLastBlock: sinonSandbox.stub(),
      removeLastBlock: sinonSandbox.stub(),
    };

    this.reset = sinonSandbox.stub();
    this.getInitialBlockHeight = sinonSandbox.stub();

    const classMethods = Object.getPrototypeOf(this);
    const emitteryMethods = Object.getPrototypeOf(classMethods);

    if (!originalEmitSerial) {
      originalEmitSerial = emitteryMethods.emitSerial;
    }

    emitteryMethods.emitSerial = sinonSandbox.stub();

    this.originalEmitSerial = originalEmitSerial.bind(this);
  }

  getState() {
    return this.state;
  }
}

module.exports = BlockchainReaderMediatorMock;
