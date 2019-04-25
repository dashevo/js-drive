/**
 * Prepare SVDocument to Api response format
 *
 * @typedef hydrateSVDocumentForApiResponse
 *
 * @param {SVDocument} svDocument
 * @returns {Document}
 */
function hydrateSVDocumentForApiResponse(svDocument) {
  const document = svDocument.getDocument();
  document.setMeta('userId', svDocument.getUserId());
  return document;
}

module.exports = hydrateSVDocumentForApiResponse;
