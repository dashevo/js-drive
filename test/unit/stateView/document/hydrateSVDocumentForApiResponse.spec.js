const getSVDocumentsFixture = require('../../../../lib/test/fixtures/getSVDocumentsFixture');

const hydrateSVDocumentForApiResponse = require('../../../../lib/stateView/document/hydrateSVDocumentForApiResponse');

describe('hydrateSVDocumentForApiResponse', () => {
  let svDocument;

  before(() => {
    [svDocument] = getSVDocumentsFixture();
  });

  it('should produce the right presentation of SVDocument for the API response', () => {
    const hydrated = hydrateSVDocumentForApiResponse(svDocument);

    const document = svDocument.getDocument();

    document.setMeta('userId', svDocument.getUserId());

    expect(hydrated).to.deep.equal(document);
  });
});
