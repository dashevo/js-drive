const getSVDocumentsFixture = require('../../../../lib/test/fixtures/getSVDocumentsFixture');

const hydrateSVDocumentForDB = require('../../../../lib/stateView/document/hydrateSVDocumentForDB');

describe('hydrateSVDocumentForDB', () => {
  let svDocument;

  before(() => {
    [svDocument] = getSVDocumentsFixture();
  });

  it('should produce the right presentation of SVDocument for the database', () => {
    const hydrated = hydrateSVDocumentForDB(svDocument);

    expect(hydrated).to.deep.equal(svDocument.toJSON());
  });
});
