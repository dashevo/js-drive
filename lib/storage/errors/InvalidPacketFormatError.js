class InvalidPacketFormatError extends Error {
  constructor(packetData) {
    super();
    this.name = this.constructor.name;
    this.message = `Invalid packet format: ${JSON.stringify(packetData)}`;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = InvalidPacketFormatError;
