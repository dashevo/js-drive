class InvalidSessionStateError extends Error {
  /**
   * Indicates, if session was not started when is should,
   * or if session was started when it should't
   * @param {ClientSession} session
   */
  constructor(session) {
    super();

    const message = session ? 'Session is already started' : 'Session is not started';

    this.name = this.constructor.name;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = InvalidSessionStateError;
