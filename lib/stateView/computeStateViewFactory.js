const StateTransitionHeader = require('../blockchain/StateTransitionHeader');
const StateTransitionPacket = require('../storage/StateTransitionPacket');
const Reference = require('./Reference');

/**
 * @param {IpfsAPI} ipfs
 * @param {updateDapContract} updateDapContract
 * @param {updateDapObject} updateDapObject
 * @returns {computeStateView}
 */
function computeStateViewFactory(ipfs, updateDapContract, updateDapObject) {
  /**
   * @typedef {Promise} computeStateView
   * @param {object} header
   * @param {object} block
   * @returns {Promise<void>}
   */
  async function computeStateView(header, block) {
    const stHeader = new StateTransitionHeader(header);
    const cid = stHeader.getPacketCID();
    const packetData = await ipfs.dag.get(cid);
    const packet = new StateTransitionPacket(packetData.value.data);

    if (packet.dapcontract) {
      const dapId = header.tsid;
      const reference = new Reference(
        block.hash,
        block.height,
        header.tsid,
        header.hashSTPacket,
        packet.dapcontract.meta.id,
      );
      await updateDapContract(dapId, reference, packet.dapcontract);
      return;
    }

    for (let i = 0; i < packet.dapobjects.length; i++) {
      const objectData = packet.dapobjects[i];
      const reference = new Reference(
        block.hash,
        block.height,
        header.tsid,
        header.hashSTPacket,
        objectData.meta.id,
      );
      await updateDapObject(packet.dapid, reference, objectData);
    }
  }

  return computeStateView;
}

module.exports = computeStateViewFactory;
