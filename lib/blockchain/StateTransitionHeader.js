const multihashes = require('multihashes');
const CID = require('cids');
const TransitionHeader = require('@dashevo/dashcore-lib/lib/stateTransition/transitionHeader');

class StateTransitionHeader extends TransitionHeader {
  constructor(data) {
    super(data);

    this.getPacketCID = function getPacketCID() {
      return this.hashDataMerkleRoot;
      const buffer = Buffer.from(this.hashDataMerkleRoot, 'hex');
      const multihash = multihashes.encode(buffer, 'sha2-256');
      return new CID(1, 'dag-cbor', multihash);
    };
  }
}

module.exports = StateTransitionHeader;
