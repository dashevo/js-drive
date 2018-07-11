const PACKET_FIELDS = ['pver', 'dapid', 'dapobjmerkleroot', 'dapcontract', 'dapobjects'];

class StateTransitionPacket {
  constructor(data) {
    Object.assign(this, data);
  }
  toJSON() {
    const result = {};
    PACKET_FIELDS.forEach((field) => {
      if (this[field] !== undefined) {
        result[field] = this[field];
      }
    });

    return result;
  }
}

module.exports = StateTransitionPacket;
