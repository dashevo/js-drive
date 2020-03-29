class UpdateStatePromiseClientMock {
  /**
   *
   * @param {Sandbox} sinon
   */
  constructor(sinon) {
    this.startTransaction = sinon.stub();
    this.applyStateTransition = sinon.stub();
    this.commitTransaction = sinon.stub();
  }
}

module.exports = UpdateStatePromiseClientMock;
