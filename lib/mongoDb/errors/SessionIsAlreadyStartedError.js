class SessionIsAlreadyStartedError extends Error {
  /**
   * Indicates, if session was started when it should't
   */
  constructor() {
    super();

    this.name = this.constructor.name;
    this.message = 'Session is already started';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = SessionIsAlreadyStartedError;
