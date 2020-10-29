class MissingChainlockError extends Error {
  constructor() {
    super('Chainlock was not retrieved from core');

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = MissingChainlockError;
