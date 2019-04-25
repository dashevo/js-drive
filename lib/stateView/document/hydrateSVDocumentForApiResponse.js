/**
 * Prepare SVDocument to Api response format
 * @param {SVDocument} svDocument
 * @param {string} userIdd
 * @returns {Document}
 */
function hydrateSVDocumentForDB(svDocument, userId) {
  const document = svDocument.getDocument();
  document.setMeta('userId', userId);
  return document;
}

module.exports = hydrateSVDocumentForDB;
