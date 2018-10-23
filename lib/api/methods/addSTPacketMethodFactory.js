const Schema = require('@dashevo/dash-schema/dash-schema-lib');

const StateTransitionPacket = require('../../storage/StateTransitionPacket');

const InvalidParamsError = require('../InvalidParamsError');
const InvalidPacketFormatError = require('../../storage/errors/InvalidPacketFormatError');

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
      const unserializedPacket = Schema.serialize.decode(params.packet);

      packet = new StateTransitionPacket(unserializedPacket);
    } catch (e) {
      throw new InvalidParamsError(`Invalid "packet" param: ${e.message}`);
    }

    let cid;
    try {
      cid = await addSTPacket(packet);
    } catch (e) {
      if (e instanceof InvalidPacketFormatError) {
        throw new InvalidParamsError(`Invalid ST Packet format: ${e.message}`);
      }

      throw e;
    }

    return cid.toBaseEncodedString();
  }

  return addSTPacketMethod;
};
