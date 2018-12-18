/**
 * @param {StateTransitionPacketIpfsRepository} stPacketRepository
 * @return {addSTPacket}
 */
module.exports = function addSTPacketFactory(stPacketRepository) {
  /**
   * Store State Transition packet in IPFS
   *
   * Stores and pins ST packet to IPFS storage and returns its hash
   *
   * @typedef addSTPacket
   * @param {StateTransitionPacket} packet State Transition packet
   * @return {Promise<string>}
   */
  async function addSTPacket(packet) {
    const packetData = packet.toJSON({ skipMeta: true });

    return stPacketRepository
      .store(packet.getCID().toBaseEncodedString(), packetData);
  }

  return addSTPacket;
};
