const SVObject = require('../../stateView/document/SVObject');

const getDocumentsFixture = require('./getDocumentsFixture');
const getReferenceFixture = require('./getReferenceFixture');

/**
 * @return {SVObject[]}
 */
function getSVObjectsFixture() {
  const { userId } = getDocumentsFixture;
  const documents = getDocumentsFixture();

  return documents.map((document, i) => new SVObject(
    userId,
    document,
    getReferenceFixture(i + 1),
  ));
}

module.exports = getSVObjectsFixture;
