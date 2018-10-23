const Schema = require('@dashevo/dash-schema/dash-schema-lib');

const InvalidPacketFormatError = require('../errors/InvalidPacketFormatError');

/**
 * @param {IpfsAPI} ipfsApi
 * @param {DapContractRepository} dapContractRepository
 * @return {addSTPacket}
 */
module.exports = function addSTPacketFactory(ipfsApi, dapContractRepository) {
  /**
   * Store State Transition packet in IPFS
   *
   * Stores and pins ST packet to IPFS storage and returns its hash
   *
   * @typedef addSTPacket
   * @param {StateTransitionPacket} packet State Transition packet
   * @return {Promise<CID>}
   */
  async function addSTPacket(packet) {
    let dapSchema;
    if (packet.dapobjects && packet.dapid) {
      const dapContract = await dapContractRepository.find(packet.dapid);
      if (!dapContract) {
        throw new InvalidPacketFormatError('Dap Contract with specified "dapid" is not found');
      }
      dapSchema = dapContract.getSchema();
    }

    const {
      valid: isValid,
      errMsg: errorMessage,
    } = Schema.validate.stpacket({ stpacket: packet }, dapSchema);

    if (!isValid) {
      throw new InvalidPacketFormatError(errorMessage);
    }

    const packetData = packet.toJSON({ skipMeta: true });

    return ipfsApi.dag.put(packetData, { cid: packet.getCID() });
  }

  return addSTPacket;
};
