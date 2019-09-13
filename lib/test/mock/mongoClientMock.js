/**
 *
 * @param sinonSandbox
 * @returns {{startSession: Sinon.SinonStub<, {
 * startTransaction: Sinon.SinonStub,
 * commitTransaction: Sinon.SinonStub,
 * abortTransaction: Sinon.SinonStub
 * }>}}
 */
module.exports = function mongoClientMock(sinonSandbox) {
  const sessionMock = {
    startTransaction: sinonSandbox.stub(),
    commitTransaction: sinonSandbox.stub(),
    abortTransaction: sinonSandbox.stub(),
  };

  return {
    startSession: sinonSandbox.stub().returns(sessionMock),
  };
};
