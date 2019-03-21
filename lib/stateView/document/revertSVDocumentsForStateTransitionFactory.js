const ReaderMediator = require('../../blockchain/reader/BlockchainReaderMediator');

/**
 *
 * @param {STPacketIpfsRepository} stPacketRepository
 * @param {RpcClient} rpcClient
 * @param {createSVDocumentMongoDbRepository} createSVDocumentRepository
 * @param {applyStateTransition} applyStateTransition
 * @param [applyStateTransitionFromReference} applyStateTransitionFromReference
 * @param {BlockchainReaderMediator} readerMediator
 * @returns {revertSVDocumentsForStateTransition}
 */
module.exports = function revertSVDocumentsForStateTransitionFactory(
  stPacketRepository,
  rpcClient,
  createSVDocumentRepository,
  applyStateTransition,
  applyStateTransitionFromReference,
  readerMediator,
) {
  /**
   * @typedef revertSVDocumentsForStateTransition
   * @param {StateTransition} stateTransition
   * @returns {Promise<void>}
   */
  async function revertSVDocumentsForStateTransition({ stateTransition }) {
    const stPacket = await stPacketRepository.find(stateTransition.getPacketCID());

    const objectTypes = new Set(stPacket.getDocuments().map(o => o.getType()));

    for (const objectType of objectTypes) {
      const svObjectRepository = await createSVDocumentRepository(
        stPacket.getContractId(),
        objectType,
      );

      const svObjects = await svObjectRepository.findAllBySTHash(stateTransition.hash);

      for (const svObject of svObjects) {
        const previousRevisions = svObject.getPreviousRevisions();

        if (previousRevisions.length === 0) {
          svObject.markAsDeleted();

          await svObjectRepository.store(svObject);

          await readerMediator.emitSerial(ReaderMediator.EVENTS.DOCUMENT_MARKED_DELETED, {
            userId: stateTransition.extraPayload.regTxId,
            objectId: svObject.getDocument().getId(),
            reference: svObject.getReference(),
            object: svObject.getDocument().toJSON(),
          });

          continue;
        }

        const [lastPreviousRevision] = previousRevisions
          .sort((prev, next) => next.revision - prev.revision);

        await applyStateTransitionFromReference(lastPreviousRevision.getReference(), true);

        await readerMediator.emitSerial(ReaderMediator.EVENTS.DOCUMENT_REVERTED, {
          userId: svObject.getUserId(),
          objectId: svObject.getDocument().getId(),
          reference: svObject.getReference(),
          object: svObject.getDocument().toJSON(),
          previousRevision: lastPreviousRevision,
        });
      }
    }
  }

  return revertSVDocumentsForStateTransition;
};
