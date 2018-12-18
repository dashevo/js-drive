const Reference = require('./Reference');

const ReaderMediator = require('../blockchain/reader/BlockchainReaderMediator');
const StateTransitionHeader = require('../blockchain/StateTransitionHeader');

const generateDapObjectId = require('../stateView/dapObject/generateDapObjectId');

const doubleSha256 = require('../util/doubleSha256');

/**
 * @param {StateTransitionPacketIpfsRepository} stPacketRepository
 * @param {updateDapContract} updateDapContract
 * @param {updateDapObject} updateDapObject
 * @param {BlockchainReaderMediator} readerMediator
 * @returns {applyStateTransition}
 */
function applyStateTransitionFactory(
  stPacketRepository,
  updateDapContract,
  updateDapObject,
  readerMediator,
) {
  /**
   * @typedef {Promise} applyStateTransition
   * @param {object} header
   * @param {object} block
   * @returns {Promise<void>}
   */
  async function applyStateTransition(header, block) {
    const stHeader = new StateTransitionHeader(header);

    const packet = stPacketRepository
      .find(stHeader.getPacketCID().toBaseEncodedString());

    if (packet.dapcontract) {
      const dapId = packet.dapcontract.upgradedapid || doubleSha256(packet.dapcontract);
      const reference = new Reference(
        block.hash,
        block.height,
        header.hash,
        header.extraPayload.hashSTPacket,
      );
      await updateDapContract(dapId, reference, packet.dapcontract);

      await readerMediator.emitSerial(ReaderMediator.EVENTS.DAP_CONTRACT_APPLIED, {
        userId: header.extraPayload.regTxId,
        dapId,
        reference,
        contract: packet.dapcontract,
      });

      return;
    }

    for (let i = 0; i < packet.dapobjects.length; i++) {
      const objectData = packet.dapobjects[i];
      const reference = new Reference(
        block.hash,
        block.height,
        header.hash,
        header.extraPayload.hashSTPacket,
      );
      await updateDapObject(packet.dapid, header.extraPayload.regTxId, reference, objectData);

      await readerMediator.emitSerial(ReaderMediator.EVENTS.DAP_OBJECT_APPLIED, {
        userId: header.extraPayload.regTxId,
        dapId: packet.dapid,
        objectId: generateDapObjectId(header.extraPayload.regTxId, objectData.idx),
        reference,
        object: objectData,
      });
    }
  }

  return applyStateTransition;
}

module.exports = applyStateTransitionFactory;
