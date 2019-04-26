const SVDocument = require('../../../../lib/stateView/document/SVDocument');

const getDocumentsFixture = require('../../../../lib/test/fixtures/getDocumentsFixture');
const getReferenceFixture = require('../../../../lib/test/fixtures/getReferenceFixture');

const hydrateSVDocumentForDB = require('../../../../lib/stateView/document/hydrateSVDocumentForDB');

describe('hydrateSVDocumentForDB', () => {
  let svDocument;
  let userId;
  let document;
  let reference;
  let isDeleted;
  let previousRevisions;

  before(() => {
    ({ userId } = getDocumentsFixture);
    [document] = getDocumentsFixture();
    reference = getReferenceFixture();
    isDeleted = false;
    previousRevisions = [];

    svDocument = new SVDocument(
      userId,
      document,
      reference,
      isDeleted,
      previousRevisions,
    );
  });

  it('should produce the right presentation of SVDocument for the database', () => {
    const hydrated = hydrateSVDocumentForDB(svDocument);

    expect(hydrated).to.deep.equal(svDocument.toJSON());
  });
});
