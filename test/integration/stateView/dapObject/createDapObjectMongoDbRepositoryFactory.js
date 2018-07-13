const DapObject = require('../../../../lib/stateView/dapObject/DapObject');
const Reference = require('../../../../lib/stateView/Reference');
const createDapObjectMongoDbRepositoryFactory = require('../../../../lib/stateView/dapObject/createDapObjectMongoDbRepositoryFactory');
const DapObjectMongoDbRepository = require('../../../../lib/stateView/dapObject/DapObjectMongoDbRepository');
const startMongoDbInstance = require('../../../../lib/test/services/mocha/startMongoDbInstance');

describe('createDapObjectMongoDbRepositoryFactory', () => {
  let createDapObjectMongoDbRepository;
  startMongoDbInstance().then(async (mongoDbInstance) => {
    const mongoClient = await mongoDbInstance.mongoClient;
    createDapObjectMongoDbRepository = createDapObjectMongoDbRepositoryFactory(
      mongoClient,
      DapObjectMongoDbRepository,
    );
  });

  it('should create DapObjectMongoDbRepository', async () => {
    const dapId = '123456';
    const dapObjectRepository = createDapObjectMongoDbRepository(dapId);

    const dapObjectId = '98765';
    const reference = new Reference();
    const objectData = {
      id: dapObjectId,
    };
    const dapObject = new DapObject(reference, objectData);
    await dapObjectRepository.store(dapObject);

    const result = await dapObjectRepository.find(dapObjectId);
    expect(result.toJSON().id).to.equal(dapObjectId);
  });
});
