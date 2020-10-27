const AbciError = require('./AbciError');

class NoDPNSContractFoundError extends AbciError {
  constructor() {
    super(
      AbciError.CODES.NOT_FOUND,
      "DPNS contract specified in the env wasn't found",
    );
  }
}

module.exports = NoDPNSContractFoundError;
