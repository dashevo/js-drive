class ReplicaSetIsNotInitializedError extends Error {
  /**
   * ReplicaSet is not initialized error
   */
  constructor() {
    super();

    this.name = this.constructor.name;
    this.message = 'Replica set is not initialized';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ReplicaSetIsNotInitializedError;
