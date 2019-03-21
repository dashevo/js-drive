const bs58 = require('bs58');

const createSVDocumentMongoDbRepositoryFactory = require('../../../../lib/stateView/document/createSVDocumentMongoDbRepositoryFactory');

describe('createSVDocumentMongoDbRepositoryFactory', () => {
  let mongoClient;
  let mongoDb;
  let createSVDocumentMongoDbRepository;
  let contractId;
  let objectType;
  let SVDocumentMongoDbRepositoryMock;
  let sanitizerMock;

  beforeEach(function beforeEach() {
    contractId = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
    objectType = 'niceDocument';

    mongoDb = {};
    mongoClient = {
      db: this.sinon.stub().returns(mongoDb),
    };

    sanitizerMock = {};

    SVDocumentMongoDbRepositoryMock = this.sinon.stub();

    createSVDocumentMongoDbRepository = createSVDocumentMongoDbRepositoryFactory(
      mongoClient,
      SVDocumentMongoDbRepositoryMock,
      sanitizerMock,
    );
  });

  it('should create a MongoDb database with a prefix + contractId', async () => {
    const contractIdEncoded = bs58.encode(Buffer.from(contractId, 'hex'));
    const dbName = `${process.env.MONGODB_DB_PREFIX}dpa_${contractIdEncoded}`;

    const result = createSVDocumentMongoDbRepository(contractId, objectType);

    expect(result).to.be.an.instanceof(SVDocumentMongoDbRepositoryMock);

    expect(mongoClient.db).to.have.been.calledOnceWith(dbName);

    expect(SVDocumentMongoDbRepositoryMock).to.have.been.calledOnceWith(
      mongoDb,
      sanitizerMock,
      objectType,
    );
  });
});
