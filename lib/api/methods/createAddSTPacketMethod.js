const addSTPacket = require('../../storage/addStateTransitionPacket');
const StateTransitionPacket = require('../../storage/StateTransitionPacket');
const InvalidParamsError = require('../InvalidParamsError');

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
   * @throws {InvalidParamsError}
   */
  async function addStateTransitionPacket(params) {
    if (!Object.prototype.hasOwnProperty.call(params, 'packet')) {
      throw new InvalidParamsError('Param "packet" is required');
    }

    let packet;
    try {
      packet = new StateTransitionPacket(params.packet);
    } catch (e) {
      throw new InvalidParamsError(`Invalid "packet" param: ${e.message}`);
    }

    return addSTPacket(ipfsApi, packet);
  }

  return addStateTransitionPacket;
};
