/**
 *
 * @param {createSVDocumentMongoDbRepository} createSVDocumentRepository
 * @param {applyStateTransition} applyStateTransition
 * @param [applyStateTransitionFromReference} applyStateTransitionFromReference
 * @returns {revertSVDocumentsForStateTransition}
 */
module.exports = function revertSVDocumentsForStateTransitionFactory(
  createSVDocumentRepository,
  applyStateTransition,
  applyStateTransitionFromReference,
) {
  /**
   * @typedef revertSVDocumentsForStateTransition
   * @param {StateTransition} stateTransition
   * @returns {Promise<void>}
   */
  async function revertSVDocumentsForStateTransition({ stateTransition }) {
    // @TODO implement getStPacket
    const stPacket = null;

    const documentTypes = new Set(stPacket.getDocuments().map(d => d.getType()));

    for (const documentType of documentTypes) {
      const svDocumentRepository = await createSVDocumentRepository(
        stPacket.getContractId(),
        documentType,
      );

      const svDocuments = await svDocumentRepository.findAllBySTHash(stateTransition.hash);

      for (const svDocument of svDocuments) {
        const previousRevisions = svDocument.getPreviousRevisions();

        if (previousRevisions.length === 0) {
          svDocument.markAsDeleted();

          await svDocumentRepository.store(svDocument);

          continue;
        }

        const [lastPreviousRevision] = previousRevisions
          .sort((prev, next) => next.revision - prev.revision);

        await applyStateTransitionFromReference(lastPreviousRevision.getReference(), true);
      }
    }
  }

  return revertSVDocumentsForStateTransition;
};
