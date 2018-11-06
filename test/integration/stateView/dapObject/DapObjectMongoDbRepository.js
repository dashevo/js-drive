const { mocha: { startMongoDb } } = require('@dashevo/js-evo-services-ctl');
const DapObject = require('../../../../lib/stateView/dapObject/DapObject');
const Reference = require('../../../../lib/stateView/Reference');
const DapObjectMongoDbRepository = require('../../../../lib/stateView/dapObject/DapObjectMongoDbRepository');
const InvalidWhereError = require('../../../../lib/stateView/dapObject/errors/InvalidWhereError');
const InvalidOrderBy = require('../../../../lib/stateView/dapObject/errors/InvalidOrderByError');
const InvalidLimitError = require('../../../../lib/stateView/dapObject/errors/InvalidLimitError');
const InvalidStartAtError = require('../../../../lib/stateView/dapObject/errors/InvalidStartAtError');
const InvalidStartAfterError = require('../../../../lib/stateView/dapObject/errors/InvalidStartAfterError');
const AmbiguousStartError = require('../../../../lib/stateView/dapObject/errors/AmbiguousStartError');

let id = 1;
function createDapObjectWithAge(age) {
  const blockchainUserId = id++;
  const isDeleted = false;
  const objectData = {
    act: 0,
    objtype: 'DashPayContact',
    user: 'dashy',
    rev: 0,
    idx: 0,
    age,
  };
  const blockHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
  const blockHeight = 1;
  const headerHash = '17jasdjk129uasd8asd023098SD09023jll123jlasd90823jklD';
  const hashSTPacket = 'ad877138as8012309asdkl123l123lka908013';
  const objectHash = 'd2123a23cks3912jasd21931234j9v8adnqwe89912331';
  const reference = new Reference(
    blockHash,
    blockHeight,
    headerHash,
    hashSTPacket,
    objectHash,
  );
  const previousRevisions = [
    {
      revision: 1,
      reference,
    },
  ];
  return new DapObject(blockchainUserId, isDeleted, objectData, reference, previousRevisions);
}

describe('DapObjectMongoDbRepository', () => {
  let dapObjectRepository;
  startMongoDb().then(async (mongoDbInstance) => {
    const mongoClient = await mongoDbInstance.getClient();
    const mongoDb = mongoClient.db('test_dap');
    dapObjectRepository = new DapObjectMongoDbRepository(mongoDb);
  });

  const dapObject = createDapObjectWithAge(90);

  it('should store DapObject entity', async () => {
    await dapObjectRepository.store(dapObject);
    const object = await dapObjectRepository.find(dapObject.getId());
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

  it('should find all dap objects by stHeaderHash', async () => {
    const { reference: { stHeaderHash } } = dapObject;
    const result = await dapObjectRepository.findAllBySTHeaderHash(stHeaderHash);
    expect(result).to.be.deep.equal([dapObject]);
  });

  it('should throw InvalidWhereError if where is not an object', async () => {
    const type = 'DashPayContact';
    const options = {
      where: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidWhereError);
  });

  it('should throw InvalidWhereError if where is boolean', async () => {
    const type = 'DashPayContact';
    const options = {
      where: false,
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidWhereError);
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
    const age = 80;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);

    const type = 'DashPayContact';
    const options = {
      limit: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result.length).to.be.equal(1);
  });

  it('should throw InvalidLimitError if limit is not a number', async () => {
    const type = 'DashPayContact';
    const options = {
      limit: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidLimitError);
  });

  it('should throw InvalidLimitError if limit is boolean', async () => {
    const type = 'DashPayContact';
    const options = {
      limit: false,
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidLimitError);
  });

  it('should order desc by DapObject id', async () => {
    const age = 99;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);

    const type = 'DashPayContact';
    const options = {
      orderBy: {
        'object.age': -1,
      },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().object.age).to.be.equal(age);
  });

  it('should order asc by DapObject id', async () => {
    const age = 50;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);

    const type = 'DashPayContact';
    const options = {
      orderBy: {
        'object.age': 1,
      },
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().object.age).to.be.equal(age);
  });

  it('should throw InvalidOrderBy if orderBy is not an object', async () => {
    const type = 'DashPayContact';
    const options = {
      orderBy: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidOrderBy);
  });

  it('should throw InvalidOrderBy if orderBy is boolean', async () => {
    const type = 'DashPayContact';
    const options = {
      orderBy: false,
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidOrderBy);
  });

  it('should start at 1 DapObject', async () => {
    const age = 1;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);

    const type = 'DashPayContact';
    const options = {
      orderBy: {
        'object.age': 1,
      },
      startAt: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().object.age).to.be.equal(age);
  });

  it('should throw InvalidStartAtError if startAt is not a number', async () => {
    const type = 'DashPayContact';
    const options = {
      startAt: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidStartAtError);
  });

  it('should throw InvalidStartAtError if startAt is boolean', async () => {
    const type = 'DashPayContact';
    const options = {
      startAt: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidStartAtError);
  });

  it('should start after 1 DapObject', async () => {
    const age = 2;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);

    const type = 'DashPayContact';
    const options = {
      orderBy: {
        'object.age': 1,
      },
      startAfter: 1,
    };
    const result = await dapObjectRepository.fetch(type, options);
    expect(result[0].toJSON().object.age).to.be.equal(age);
  });

  it('should throw InvalidStartAfterError if startAfter is not a number', async () => {
    const type = 'DashPayContact';
    const options = {
      startAfter: 'something',
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidStartAfterError);
  });

  it('should throw InvalidStartAfterError if startAfter is boolean', async () => {
    const type = 'DashPayContact';
    const options = {
      startAfter: false,
    };

    let error;
    try {
      await dapObjectRepository.fetch(type, options);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(InvalidStartAfterError);
  });

  it('should throw AmbiguousStartError if the both startAt and startAfter are present', async () => {
    let error;
    try {
      await dapObjectRepository.fetch('any', { startAt: 1, startAfter: 2 });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(AmbiguousStartError);
  });

  it('should return empty array if fetch does not find DapObjects', async () => {
    const type = 'UnknownType';
    const result = await dapObjectRepository.fetch(type);
    expect(result).to.be.deep.equal([]);
  });

  it('should delete DapObject entity', async () => {
    const age = 5;
    const dapObj = createDapObjectWithAge(age);
    await dapObjectRepository.store(dapObj);
    const object = await dapObjectRepository.find(dapObj.getId());
    expect(object.toJSON()).to.deep.equal(dapObj.toJSON());

    await dapObjectRepository.delete(dapObj);
    const objectTwo = await dapObjectRepository.find(dapObj.getId());
    expect(objectTwo).to.be.null();
  });

  it('should return empty DapObject if not found', async () => {
    const object = await dapObjectRepository.find();

    expect(object).to.be.null();
  });
});
