const Document = require('@dashevo/dpp/lib/document/Document');
const SVObject = require('./SVObject');

function updateSVObjectFactory(createSVObjectRepository) {
  /**
   * Generate DP Object State View
   *
   * @typedef {Promise} updateSVObject
   * @param {string} contractId
   * @param {string} userId
   * @param {Reference} reference
   * @param {Document} document
   * @param {boolean} reverting
   * @returns {Promise<void>}
   */
  async function updateSVObject(contractId, userId, reference, document, reverting) {
    const svObjectRepository = createSVObjectRepository(contractId, document.getType());

    const svObject = new SVObject(userId, document, reference);

    switch (document.getAction()) {
      case Document.ACTIONS.CREATE: {
        await svObjectRepository.store(svObject);

        break;
      }

      case Document.ACTIONS.DELETE: {
        svObject.markAsDeleted();
      }
      // eslint-disable-next-line no-fallthrough
      case Document.ACTIONS.UPDATE: {
        const previousSVObject = await svObjectRepository.find(svObject.getDocument().getId());

        if (!previousSVObject) {
          throw new Error('There is no object to update');
        }

        svObject.addRevision(previousSVObject);

        // NOTE: Since reverting is more complicated
        // `previousSVObject` is actually next one here
        // so we have to remove it's revision and the revision before that
        // to have a proper set of `previousRevisions`
        if (reverting) {
          svObject.removeAheadRevisions();
        }

        await svObjectRepository.store(svObject);

        break;
      }

      default: {
        throw new Error('Unsupported action');
      }
    }
  }

  return updateSVObject;
}

module.exports = updateSVObjectFactory;
