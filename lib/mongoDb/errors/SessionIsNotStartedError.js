class SessionIsNotStartedError extends Error {
  /**
   * Indicates, if session was not started when is should
   */
  constructor() {
    super();

    this.name = this.constructor.name;
    this.message = 'Session is not started';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = SessionIsNotStartedError;
