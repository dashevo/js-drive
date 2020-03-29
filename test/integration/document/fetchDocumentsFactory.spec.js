const { mocha: { startMongoDb } } = require('@dashevo/dp-services-ctl');

const DashPlatformProtocol = require('@dashevo/dpp');

const SVDocumentMongoDbRepository = require('../../../lib/document/mongoDbRepository/DocumentMongoDbRepository');
const convertWhereToMongoDbQuery = require('../../../lib/document/mongoDbRepository/convertWhereToMongoDbQuery');
const validateQueryFactory = require('../../../lib/document/query/validateQueryFactory');
const findConflictingConditions = require('../../../lib/document/query/findConflictingConditions');
const InvalidQueryError = require('../../../lib/document/errors/InvalidQueryError');

const createSVDocumentMongoDbRepositoryFactory = require('../../../lib/document/mongoDbRepository/createDocumentMongoDbRepositoryFactory');
const fetchDocumentsFactory = require('../../../lib/document/fetchDocumentsFactory');
const SVContractMongoDbRepository = require('../../../lib/dataContract/SVContractMongoDbRepository');

const getSVDocumentsFixture = require('../../../lib/test/fixtures/getSVDocumentsFixture');
const getSVContractFixture = require('../../../lib/test/fixtures/getSVContractFixture');

const findNotIndexedFields = require('../../../lib/document/query/findNotIndexedFields');
const findNotIndexedOrderByFields = require('../../../lib/document/query/findNotIndexedOrderByFields');
const getIndexedFieldsFromDocumentSchema = require('../../../lib/document/query/getIndexedFieldsFromDocumentSchema');

describe('fetchDocumentsFactory', () => {
  let createSVDocumentMongoDbRepository;
  let fetchDocuments;
  let mongoClient;
  let svDocument;
  let documentType;
  let contractId;
  let document;
  let svContractMongoDbRepository;
  let svContract;

  startMongoDb().then((mongoDb) => {
    mongoClient = mongoDb.getClient();
  });

  beforeEach(async () => {
    const validateQuery = validateQueryFactory(
      findConflictingConditions,
      getIndexedFieldsFromDocumentSchema,
      findNotIndexedFields,
      findNotIndexedOrderByFields,
    );

    createSVDocumentMongoDbRepository = createSVDocumentMongoDbRepositoryFactory(
      mongoClient,
      SVDocumentMongoDbRepository,
      convertWhereToMongoDbQuery,
      validateQuery,
    );

    const mongo = mongoClient.db('test');

    svContractMongoDbRepository = new SVContractMongoDbRepository(
      mongo,
      new DashPlatformProtocol(),
    );

    fetchDocuments = fetchDocumentsFactory(
      createSVDocumentMongoDbRepository,
      svContractMongoDbRepository,
    );

    svContract = getSVContractFixture();

    contractId = svContract.getId();

    [svDocument] = getSVDocumentsFixture();

    document = svDocument.getDocument();
    documentType = document.getType();

    await svContractMongoDbRepository.store(svContract);
  });

  it('should fetch Documents for specified contract ID and document type', async () => {
    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);
    await svDocumentRepository.store(svDocument);

    const result = await fetchDocuments(contractId, documentType);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);

    const [actualDocument] = result;

    const documentJSON = document.toJSON();

    expect(actualDocument.toJSON()).to.deep.equal(documentJSON);
  });

  it('should fetch Documents for specified contract id, document type and name', async () => {
    let result = await fetchDocuments(contractId, documentType);

    expect(result).to.deep.equal([]);

    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);
    await svDocumentRepository.store(svDocument);

    const query = { where: [['name', '==', document.get('name')]] };
    result = await fetchDocuments(contractId, documentType, query);

    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);

    const [actualDocument] = result;

    const documentJSON = document.toJSON();

    expect(actualDocument.toJSON()).to.deep.equal(documentJSON);
  });

  it('should return empty array for specified contract ID, document type and name not exist', async () => {
    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);
    await svDocumentRepository.store(svDocument);

    const query = { where: [['name', '==', 'unknown']] };

    const result = await fetchDocuments(contractId, documentType, query);

    expect(result).to.deep.equal([]);
  });

  it('should throw InvalidQueryError if contract ID does not exist', async () => {
    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);

    await svDocumentRepository.store(svDocument);

    contractId = 'Unknown';

    try {
      await fetchDocuments(contractId, documentType);

      expect.fail('should throw InvalidQueryError');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidQueryError);
      expect(e.getErrors()).to.be.an('array');
      expect(e.getErrors()).to.have.lengthOf(1);

      const [error] = e.getErrors();

      expect(error.getContractId()).to.be.equal(contractId);
    }
  });

  it('should throw InvalidQueryError if type does not exist', async () => {
    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);

    await svDocumentRepository.store(svDocument);

    documentType = 'Unknown';

    try {
      await fetchDocuments(contractId, documentType);

      expect.fail('should throw InvalidQueryError');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidQueryError);
      expect(e.getErrors()).to.be.an('array');
      expect(e.getErrors()).to.have.lengthOf(1);

      const [error] = e.getErrors();

      expect(error.getDocumentType()).to.be.equal(documentType);
    }
  });

  it('should throw InvalidQueryError if searching by non indexed fields', async () => {
    const svDocumentRepository = createSVDocumentMongoDbRepository(contractId, documentType);
    await svDocumentRepository.store(svDocument);

    const query = { where: [['lastName', '==', 'unknown']] };

    try {
      await fetchDocuments(contractId, documentType, query);

      expect.fail('should throw InvalidQueryError');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidQueryError);
      expect(e.getErrors()).to.be.an('array');
      expect(e.getErrors()).to.have.lengthOf(1);

      const [error] = e.getErrors();

      expect(error.getNotIndexedField()).to.be.equal('lastName');
    }
  });
});
