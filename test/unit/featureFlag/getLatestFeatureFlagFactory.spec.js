const Identifier = require('@dashevo/dpp/lib/Identifier');
const getDocumentsFixture = require('@dashevo/dpp/lib/test/fixtures/getDocumentsFixture');

const Long = require('long');

const BlockExecutionContextMock = require('../../../lib/test/mock/BlockExecutionContextMock');

const getLatestFeatureFlagFactory = require('../../../lib/featureFlag/getLatestFeatureFlagFactory');

describe('getLatestFeatureFlagFactory', () => {
  let featureFlagDataContractId;
  let fetchDocumentsMock;
  let blockExecutionContextMock;
  let getLatestFeatureFlag;
  let document;

  beforeEach(function beforeEach() {
    featureFlagDataContractId = Identifier.from(Buffer.alloc(32, 1));

    ([document] = getDocumentsFixture());

    fetchDocumentsMock = this.sinon.stub();
    fetchDocumentsMock.resolves([
      document,
    ]);

    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);
    blockExecutionContextMock.getHeader.returns({
      height: new Long(42),
    });

    getLatestFeatureFlag = getLatestFeatureFlagFactory(
      featureFlagDataContractId,
      fetchDocumentsMock,
      blockExecutionContextMock,
    );
  });

  it('should call `fetchDocuments` and return first item from the result', async () => {
    const result = await getLatestFeatureFlag('someType');

    const query = {
      where: [
        ['enableAtHeight', '<=', 42],
      ],
      orderBy: [
        ['enableAtHeight', 'desc'],
      ],
      limit: 1,
    };

    expect(fetchDocumentsMock).to.have.been.calledOnceWithExactly(
      featureFlagDataContractId,
      'someType',
      query,
    );
    expect(result).to.deep.equal(document);
  });
});
