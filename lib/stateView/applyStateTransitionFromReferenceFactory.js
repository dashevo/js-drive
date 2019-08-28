/**
 * Create applyStateTransitionFromReference
 * @param {applyStateTransition} applyStateTransition
 * @returns {applyStateTransitionFromReference}
 */
module.exports = function applyStateTransitionFromReferenceFactory(
  applyStateTransition,
) {
  /**
   * @typedef applyStateTransitionFromReference
   * @param {Reference} reference
   * @param {boolean} [reverting]
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async function applyStateTransitionFromReference({ blockHash, stHash }, reverting = false) {
    // @TODO find out how to get stateTransition, block
    const stateTransition = null;
    const block = null;

    await applyStateTransition(stateTransition, block, reverting);
  }

  return applyStateTransitionFromReference;
};
