class PacketNotPinnedError extends Error {
  constructor(cid, ...params) {
    super(...params);

    this.name = this.constructor.name;
    this.message = 'packet is not pinned';
    this.cid = cid;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Return CID submitted with error
   *
   * @returns {CID}
   */
  getCID() {
    return this.cid;
  }
}

module.exports = PacketNotPinnedError;
