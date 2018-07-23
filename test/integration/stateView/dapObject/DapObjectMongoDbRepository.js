const DapObject = require('../../../../lib/stateView/dapObject/DapObject');
const Reference = require('../../../../lib/stateView/Reference');
const DapObjectMongoDbRepository = require('../../../../lib/stateView/dapObject/DapObjectMongoDbRepository');
const startMongoDbInstance = require('../../../../lib/test/services/mocha/startMongoDbInstance');

describe('DapObjectMongoDbRepository', () => {
  let dapObjectRepository;
  startMongoDbInstance().then(async (mongoDbInstance) => {
    const mongoClient = await mongoDbInstance.mongoClient;
    const mongoDb = mongoClient.db('test_dap');
    dapObjectRepository = new DapObjectMongoDbRepository(mongoDb);
  });

  const id = '123456';
  const objectData = {
    id,
    act: 0,
    objtype: 'DashPayContact',
    user: 'dashy',
    rev: 0,
  };
  const blockHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
  const blockHeight = 1;
  const headerHash = '17jasdjk129uasd8asd023098SD09023jll123jlasd90823jklD';
  const hashSTPacket = 'ad877138as8012309asdkl123l123lka908013';
  const reference = new Reference(
    blockHash,
    blockHeight,
    headerHash,
    hashSTPacket,
  );
  const dapObject = new DapObject(objectData, reference);

  it('should store DapObject entity', async () => {
    await dapObjectRepository.store(dapObject);
    const object = await dapObjectRepository.find(id);
    expect(object.toJSON()).to.deep.equal(dapObject.toJSON());
  });

  it('should fetch DapObject by type', async () => {
    const type = 'DashPayContact';
    const result = await dapObjectRepository.fetch(type);
    expect(result).to.be.deep.equal([dapObject]);
  });

  it('should fetch DapObject by type with where condition', async () => {
    const type = 'DashPayContact';
    const options = {
      where: { 'object.user': 'dashy' },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result).to.be.deep.equal([dapObject]);
  });

  it('should return empty array if where conditions do not match', async () => {
    const type = 'DashPayContact';
    const options = {
      where: { 'object.aboutme': 'Dash enthusiast' },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result).to.be.deep.equal([]);
  });

  it('should throw unknown operator error if where conditions are invalid', async () => {
    const type = 'DashPayContact';
    const options = {
      where: { 'object.user': { $dirty: true } },
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error.message).to.be.equal('unknown operator: $dirty');
  });

  it('should limit return to 1 DapObject if limit', async () => {
    objectData.id = '4444';
    const dapObject2 = new DapObject(objectData, reference);
    await dapObjectRepository.store(dapObject2);
    const type = 'DashPayContact';
    const options = {
      limit: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result.length).to.be.equal(1);
  });

  it('should order desc by DapObject id', async () => {
    const type = 'DashPayContact';
    const options = {
      orderBy: {
        id: -1,
      },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().id).to.be.equal('4444');
  });

  it('should order asc by DapObject id', async () => {
    const type = 'DashPayContact';
    const options = {
      orderBy: {
        id: 1,
      },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().id).to.be.equal('123456');
  });

  it('should start at 1 DapObject', async () => {
    const type = 'DashPayContact';
    const options = {
      startAt: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().id).to.be.equal('123456');
  });

  it('should start after 1 DapObject', async () => {
    const type = 'DashPayContact';
    const options = {
      startAfter: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().id).to.be.equal('4444');
  });

  it('should return empty array if fetch does not find DapObjects', async () => {
    const type = 'UnknownType';
    const result = await dapObjectRepository.fetch(type);
    expect(result).to.be.deep.equal([]);
  });

  xit('should delete DapObject entity', async () => {
    await dapObjectRepository.store(dapObject);
    const object = await dapObjectRepository.find(id);
    expect(object.toJSON()).to.deep.equal(dapObject.toJSON());

    await dapObjectRepository.delete(dapObject);
    const objectTwo = await dapObjectRepository.find(id);
    const serializeObject = objectTwo.toJSON();
    expect(serializeObject.id).to.not.exist();
  });

  it('should return empty DapObject if not found', async () => {
    const object = await dapObjectRepository.find();

    const serializeObject = object.toJSON();
    expect(serializeObject.id).to.not.exist();
  });
});
