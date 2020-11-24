class DataCorruptedError extends Error {
  constructor() {
    const message = 'Data is corrupted. Please reset you node';
    super(message);
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = DataCorruptedError;
