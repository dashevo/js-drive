const StateTransitionPacket = require('../../storage/StateTransitionPacket');
const InvalidParamsError = require('../InvalidParamsError');

/**
 * @param {addSTPacket} addSTPacket
 * @return {addSTPacketMethod}
 */
module.exports = function addSTPacketMethodFactory(addSTPacket) {
  /**
   * @typedef addSTPacketMethod
   * @param params
   * @param {string} params.packet
   * @return {Promise<string>}
   * @throws {InvalidParamsError}
   */
  async function addSTPacketMethod(params) {
    if (!Object.prototype.hasOwnProperty.call(params, 'packet')) {
      throw new InvalidParamsError('Param "packet" is required');
    }

    let packet;
    try {
      packet = new StateTransitionPacket(params.packet);
    } catch (e) {
      throw new InvalidParamsError(`Invalid "packet" param: ${e.message}`);
    }

    return addSTPacket(packet);
  }

  return addSTPacketMethod;
};
