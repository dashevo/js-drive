const AbciError = require('./AbciError');

class NotSupportedAppVersionError extends AbciError {
  /**
   * @param {number} blockAppVersion
   * @param {number} localAppVersion
   */
  constructor(blockAppVersion, localAppVersion) {
    super(
      AbciError.CODES.PROTOCOL_VERSION_NOT_SUPPORTED,
      'Block protocol version not supported',
      { blockAppVersion, localAppVersion },
    );
  }
}

module.exports = NotSupportedAppVersionError;
