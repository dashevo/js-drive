/**
 * @param {SVContractMongoDbRepository} svContractRepository
 * @param {applyStateTransition} applyStateTransition
 * @param {applyStateTransitionFromReference} applyStateTransitionFromReference
 * @returns {revertSVContractsForStateTransition}
 */
function revertSVContractsForStateTransitionFactory(
  svContractRepository,
  applyStateTransition,
  applyStateTransitionFromReference,
) {
  /**
   * @typedef revertSVContractsForStateTransition
   * @param {{ stateTransition: StateTransition, block: object }}
   * @returns {Promise<void>}
   */
  async function revertSVContractsForStateTransition({ stateTransition }) {
    const svContracts = await svContractRepository
      .findAllByReferenceSTHash(stateTransition.hash);

    for (const svContract of svContracts) {
      const previousRevisions = svContract.getPreviousRevisions();

      if (previousRevisions.length === 0) {
        svContract.markAsDeleted();

        await svContractRepository.store(svContract);

        continue;
      }

      const [lastPreviousRevision] = previousRevisions
        .sort((prev, next) => next.getRevision() - prev.getRevision());

      await applyStateTransitionFromReference(lastPreviousRevision.getReference(), true);
    }
  }

  return revertSVContractsForStateTransition;
}

module.exports = revertSVContractsForStateTransitionFactory;
