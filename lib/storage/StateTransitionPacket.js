const multihashes = require('multihashes');
const CID = require('cids');
const doubleSha256 = require('../util/doubleSha256');

const PACKET_FIELDS = ['pver', 'dapid', 'dapobjectshash', 'dapcontract', 'dapobjects', 'meta'];

class StateTransitionPacket {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Get packet IPFS CID
   *
   * @return {CID}
   */
  getCID() {
    return StateTransitionPacket.createCIDFromHash(this.getHash());
  }

  /**
   * Get packet hash
   *
   * @return {string}
   */
  getHash() {
    return doubleSha256(this.toJSON({ skipMeta: true }));
  }

  /**
   * @param [skipMeta]
   */
  toJSON({ skipMeta = false }) {
    const result = {};
    PACKET_FIELDS.forEach((field) => {
      if (this[field] !== undefined) {
        result[field] = this[field];
      }
    });

    if (skipMeta) {
      delete result.meta;
    }

    return result;
  }

  /**
   * Create IPFS CID from hash
   *
   * @param {string} hash
   * @return {CID}
   */
  static createCIDFromHash(hash) {
    const buffer = Buffer.from(hash, 'hex');
    const multihash = multihashes.encode(buffer, 'dbl-sha2-256');
    return new CID(1, 'dag-cbor', multihash);
  }
}

module.exports = StateTransitionPacket;
