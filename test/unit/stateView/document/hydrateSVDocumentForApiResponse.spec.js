const SVDocument = require('../../../../lib/stateView/document/SVDocument');

const getDocumentsFixture = require('../../../../lib/test/fixtures/getDocumentsFixture');
const getReferenceFixture = require('../../../../lib/test/fixtures/getReferenceFixture');

const hydrateSVDocumentForApiResponse = require('../../../../lib/stateView/document/hydrateSVDocumentForApiResponse');

describe('hydrateSVDocumentForApiResponse', () => {
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

  it('should produce the right presentation of SVDocument for the API response', () => {
    const hydrated = hydrateSVDocumentForApiResponse(svDocument);

    document.setMeta('userId', userId);

    expect(hydrated).to.deep.equal(document);
  });
});
