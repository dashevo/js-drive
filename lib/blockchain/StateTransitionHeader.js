const TransitionHeader = require('@dashevo/dashcore-lib/lib/stateTransition/transitionHeader');

class StateTransitionHeader extends TransitionHeader {
  constructor(data) {
    super(data);

    // TODO: Remove when getPacketHash will be implemented in bitcore-lib
    if (data.hashDataMerkleRoot) {
      this.getPacketHash = function getPacketHash() {
        return this.hashDataMerkleRoot;
      };
    }
  }
}

module.exports = StateTransitionHeader;
