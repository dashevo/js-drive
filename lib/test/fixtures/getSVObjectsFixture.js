const SVObject = require('../../stateView/document/SVObject');

const getDocumentsFixture = require('./getDocumentsFixture');
const getReferenceFixture = require('./getReferenceFixture');

/**
 * @return {SVObject[]}
 */
function getSVObjectsFixture() {
  const { userId } = getDocumentsFixture;
  const dpObjects = getDocumentsFixture();

  return dpObjects.map((dpObject, i) => new SVObject(
    userId,
    dpObject,
    getReferenceFixture(i + 1),
  ));
}

module.exports = getSVObjectsFixture;
