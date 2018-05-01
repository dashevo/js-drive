const addSTPacket = require('../../storage/addStateTransitionPacket');
const StateTransitionPacket = require('../../storage/StateTransitionPacket');

/**
 * @param {IpfsAPI} ipfsApi
 * @return {addStateTransitionPacket}
 */
module.exports = function createAddSTPacketMethod(ipfsApi) {
  /**
   * @typedef addStateTransitionPacket
   * @param params
   * @param {string} params.packet
   * @return {Promise<string>}
   * @throws {Error}
   */
  async function addStateTransitionPacket(params) {
    if (!params.packet) {
      const error = new Error('Param "packet" is required');
      error.code = -32602;
      throw error;
    }

    let packet;
    try {
      packet = new StateTransitionPacket(params.packet);
    } catch (e) {
      const error = new Error('Invalid packet format');

      error.code = -32602;
      error.data = e.message;

      throw error;
    }

    return addSTPacket(ipfsApi, packet);
  }

  return addStateTransitionPacket;
};
