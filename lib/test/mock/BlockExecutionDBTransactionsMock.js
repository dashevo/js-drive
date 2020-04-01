/**
 * @method start
 * @method commit
 * @method abort
 * @method getTransaction
 */
class BlockExecutionDBTransactionMock {
  /**
   * @param {Sandbox} sinon
   */
  constructor(sinon) {
    this.start = sinon.stub();
    this.commit = sinon.stub();
    this.abort = sinon.stub();
    this.getTransaction = sinon.stub();
  }
}

module.exports = BlockExecutionDBTransactionMock;
