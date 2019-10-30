const createContractDatabaseFactory = require('../../../../lib/stateView/contract/createContractDatabaseFactory');
const SVContract = require('../../../../lib/stateView/contract/SVContract');

const getDataContractFixture = require('../../../../lib/test/fixtures/getDataContractFixture');
const getReferenceFixture = require('../../../../lib/test/fixtures/getReferenceFixture');

describe('createContractDatabaseFactory', () => {
  let createContractDatabase;
  let svContract;
  let createCollection;
  let convertToMongoDbIndices;

  beforeEach(function beforeEach() {
    const contract = getDataContractFixture();
    const reference = getReferenceFixture();

    const isDeleted = false;
    const previousRevisions = [];

    svContract = new SVContract(
      contract,
      reference,
      isDeleted,
      previousRevisions,
    );

    createCollection = this.sinon.stub();

    const svDocumentRepository = {
      createCollection,
    };

    const createSVDocumentRepository = () => svDocumentRepository;

    convertToMongoDbIndices = this.sinon.stub();

    createContractDatabase = createContractDatabaseFactory(
      createSVDocumentRepository,
      convertToMongoDbIndices,
    );
  });

  it('should create all collections with indices', async () => {
    await createContractDatabase(svContract);

    const documents = svContract.getDataContract().getDocuments();

    expect(createCollection).to.be.called(documents.length);
    expect(convertToMongoDbIndices).to.be.calledOnce();
  });
});
