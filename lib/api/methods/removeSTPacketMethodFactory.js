const CID = require('cids');

const InvalidParamsError = require('../InvalidParamsError');

/**
 * @param {removeSTPacket} removeSTPacket
 * @return {removeSTPacketMethod}
 */
module.exports = function removeSTPacketMethodFactory(removeSTPacket) {
  /**
   * @typedef removeSTPacketMethod
   * @param params
   * @param {string} params.cid
   * @return {Promise<void>}
   * @throws {InvalidParamsError}
   */
  async function removeSTPacketMethod(params) {
    if (!Object.prototype.hasOwnProperty.call(params, 'cid')) {
      throw new InvalidParamsError('Param "cid" is required');
    }

    let cid;
    try {
      cid = new CID(params.cid);
    } catch (e) {
      throw new InvalidParamsError(`Invalid "cid" param: ${e.message}`);
    }

    await removeSTPacket(cid);
  }

  return removeSTPacketMethod;
};
