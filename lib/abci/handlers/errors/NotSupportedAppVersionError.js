class NotSupportedAppVersionError extends Error {
  /**
   * @param {number} blockAppVersion
   * @param {number} localAppVersion
   */
  constructor(blockAppVersion, localAppVersion) {
    const message = `Block protocol version ${blockAppVersion} not supported. Expected to be less or equal to ${localAppVersion}.`;
    super(message);
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = NotSupportedAppVersionError;
