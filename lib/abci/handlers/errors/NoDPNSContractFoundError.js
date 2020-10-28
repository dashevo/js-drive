class NoDPNSContractFoundError extends Error {
  constructor() {
    super('DPNS contract specified in the env wasn\'t found');
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = NoDPNSContractFoundError;
