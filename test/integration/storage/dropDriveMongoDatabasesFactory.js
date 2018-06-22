const startMongoDbInstance = require('../../../lib/test/services/mocha/startMongoDbInstance');
const dropDriveMongoDatabasesFactory = require('../../../lib/storage/dropDriveMongoDatabasesFactory');

describe('Clean DD instance', () => {
  let mongoClient;
  startMongoDbInstance().then((instance) => {
    ({ mongoClient } = instance);
  });

  it('should drop all Drive Mongo databases', async () => {
    await mongoClient.db('drive_db').collection('dapObjects').insertOne({ name: 'DashPay' });

    const { databases: dbs } = await mongoClient.db().admin().listDatabases();
    const filterDb = dbs.filter(db => db.name.includes('drive_'));
    expect(filterDb.length).to.equal(1);

    const dropDriveMongoDatabases = dropDriveMongoDatabasesFactory(mongoClient);
    await dropDriveMongoDatabases();

    const { databases: dbsAfter } = await mongoClient.db().admin().listDatabases();
    const filterDbAfter = dbsAfter.filter(db => db.name.includes('drive_'));
    expect(filterDbAfter.length).to.equal(0);
  });
});
