const { mocha: { startMongoDb } } = require('@dashevo/dp-services-ctl');

const SVObjectMongoDbRepository = require('../../../../lib/stateView/document/SVObjectMongoDbRepository');

const sanitizer = require('../../../../lib/mongoDb/sanitizer');
const createSVObjectMongoDbRepositoryFactory = require('../../../../lib/stateView/document/createSVObjectMongoDbRepositoryFactory');
const fetchDocumentsFactory = require('../../../../lib/stateView/document/fetchDocumentsFactory');

const getSVObjectsFixture = require('../../../../lib/test/fixtures/getSVObjectsFixture');

describe('fetchDocumentsFactory', () => {
  let createSVObjectMongoDbRepository;
  let fetchDocuments;
  let mongoClient;
  let svObject;
  let type;
  let contractId;
  let document;

  startMongoDb().then((mongoDb) => {
    mongoClient = mongoDb.getClient();
  });

  beforeEach(() => {
    createSVObjectMongoDbRepository = createSVObjectMongoDbRepositoryFactory(
      mongoClient,
      SVObjectMongoDbRepository,
      sanitizer,
    );

    fetchDocuments = fetchDocumentsFactory(createSVObjectMongoDbRepository);

    [svObject] = getSVObjectsFixture();

    document = svObject.getDocument();
    type = document.getType();
    contractId = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
  });

  it('should fetch Documents for specified contract ID and object type', async () => {
    const svObjectRepository = createSVObjectMongoDbRepository(contractId, type);
    await svObjectRepository.store(svObject);

    const result = await fetchDocuments(contractId, type);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);

    const [actualDocument] = result;

    expect(actualDocument.toJSON()).to.deep.equal(document.toJSON());
  });

  it('should fetch Documents for specified contract id, object type and name', async () => {
    let result = await fetchDocuments(contractId, type);

    expect(result).to.deep.equal([]);

    const svObjectRepository = createSVObjectMongoDbRepository(contractId, type);
    await svObjectRepository.store(svObject);

    const options = { where: { 'document.name': document.get('name') } };
    result = await fetchDocuments(contractId, type, options);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);

    const [actualDocument] = result;

    expect(actualDocument.toJSON()).to.deep.equal(document.toJSON());
  });

  it('should return empty array for specified contract ID, object type and name not exist', async () => {
    const svObjectRepository = createSVObjectMongoDbRepository(contractId, type);
    await svObjectRepository.store(svObject);

    const options = { where: { 'document.name': 'unknown' } };

    const result = await fetchDocuments(contractId, type, options);

    expect(result).to.deep.equal([]);
  });

  it('should return empty array if contract ID does not exist', async () => {
    const svObjectRepository = createSVObjectMongoDbRepository(contractId, type);

    await svObjectRepository.store(svObject);

    contractId = 'Unknown';

    const result = await fetchDocuments(contractId, type);

    expect(result).to.deep.equal([]);
  });

  it('should return empty array if type does not exist', async () => {
    const svObjectRepository = createSVObjectMongoDbRepository(contractId, type);

    await svObjectRepository.store(svObject);

    type = 'Unknown';

    const result = await fetchDocuments(contractId, type);

    expect(result).to.deep.equal([]);
  });
});
