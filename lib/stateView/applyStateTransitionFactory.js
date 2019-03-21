const Reference = require('./revisions/Reference');

const ReaderMediator = require('../blockchain/reader/BlockchainReaderMediator');
const StateTransition = require('../blockchain/StateTransition');

/**
 * @param {STPacketIpfsRepository} stPacketRepository
 * @param {updateSVContract} updateSVContract
 * @param {updateSVObject} updateSVObject
 * @param {BlockchainReaderMediator} readerMediator
 * @returns {applyStateTransition}
 */
function applyStateTransitionFactory(
  stPacketRepository,
  updateSVContract,
  updateSVObject,
  readerMediator,
) {
  /**
   * @typedef {Promise} applyStateTransition
   * @param {Object} rawStateTransition
   * @param {Object} block
   * @param {boolean} [reverting]
   * @returns {Promise<void>}
   */
  async function applyStateTransition(rawStateTransition, block, reverting = false) {
    const stateTransition = new StateTransition(rawStateTransition);

    const stPacket = await stPacketRepository
      .find(stateTransition.getPacketCID());

    if (stPacket.getContract()) {
      const reference = new Reference({
        blockHash: block.hash,
        blockHeight: block.height,
        stHash: stateTransition.hash,
        stPacketHash: stateTransition.extraPayload.hashSTPacket,
        hash: stPacket.getContract().hash(),
      });

      await updateSVContract(
        stPacket.getContractId(),
        stateTransition.extraPayload.regTxId,
        reference,
        stPacket.getContract(),
        reverting,
      );

      await readerMediator.emitSerial(ReaderMediator.EVENTS.CONTRACT_APPLIED, {
        userId: stateTransition.extraPayload.regTxId,
        contractId: stPacket.getContractId(),
        reference,
        contract: stPacket.getContract().toJSON(),
      });

      return;
    }

    for (const dpObject of stPacket.getDPObjects()) {
      const reference = new Reference({
        blockHash: block.hash,
        blockHeight: block.height,
        stHash: stateTransition.hash,
        stPacketHash: stateTransition.extraPayload.hashSTPacket,
        hash: dpObject.hash(),
      });

      await updateSVObject(
        stPacket.getContractId(),
        stateTransition.extraPayload.regTxId,
        reference,
        dpObject,
        reverting,
      );

      await readerMediator.emitSerial(ReaderMediator.EVENTS.DP_OBJECT_APPLIED, {
        userId: stateTransition.extraPayload.regTxId,
        contractId: stPacket.getContractId(),
        objectId: dpObject.getId(),
        reference,
        object: dpObject.toJSON(),
      });
    }
  }

  return applyStateTransition;
}

module.exports = applyStateTransitionFactory;
