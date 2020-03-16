class ReplicaSetInitError extends Error {
  constructor(message, replicaStatus) {
    super();

    this.name = this.constructor.name;
    this.message = message;
    this.replicaStatus = replicaStatus;

    Error.captureStackTrace(this, this.constructor);
  }

  getReplicaStatus() {
    return this.replicaStatus;
  }
}

module.exports = ReplicaSetInitError;
