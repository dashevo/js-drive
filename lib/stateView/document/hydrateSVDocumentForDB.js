/**
 * Prepare SVDocument to DB format
 * @param {SVDocument} svDocument
 * @returns {Object}
 */
function hydrateSVDocumentForDB(svDocument) {
  return svDocument.toJSON();
}

module.exports = hydrateSVDocumentForDB;
