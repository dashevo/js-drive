const startIpfsInstance = require('../lib/test/services/mocha/startIPFSInstance');
const startMongoDbInstance = require('../lib/test/services/mocha/startMongoDbInstance');

async function addPinPacket(ipfsApi) {
  const packet = {};
  const cid = await ipfsApi.dag.put(packet, { format: 'dag-cbor', hashAlg: 'sha2-256' });
  await ipfsApi.pin.add(cid.toBaseEncodedString(), { recursive: true });
  return cid.toBaseEncodedString();
}

function byCid(cid) {
  return object => object.hash === cid;
}

function unpinAllPacketsFactory(ipfsApi) {
  async function unpinAllPackets() {
    const pinset = await ipfsApi.pin.ls();
    const byPinType = type => pin => pin.type === type;
    const pins = pinset.filter(byPinType('recursive'));

    for (let index = 0; index < pins.length; index++) {
      const pin = pins[index];
      await ipfsApi.pin.rm(pin.hash);
    }
  }

  return unpinAllPackets;
}

function dropDriveMongoDatabasesFactory(mongoClient) {
  async function dropDriveMongoDatabases() {
    const { databases: dbs } = await mongoClient.db().admin().listDatabases();
    const dbStartingBy = prefix => db => db.name.includes(prefix);
    const driveDatabases = dbs.filter(dbStartingBy('drive_'));

    for (let index = 0; index < driveDatabases.length; index++) {
      const db = driveDatabases[index];
      await mongoClient.db(db.name).dropDatabase();
    }
  }

  return dropDriveMongoDatabases;
}

function cleanDashDriveFactory(unpinAllPackets, dropDriveMongoDatabases) {
  async function cleanDashDrive() {
    await unpinAllPackets();
    await dropDriveMongoDatabases();
  }

  return cleanDashDrive;
}

describe('Clean DD instance', () => {
  let ipfsInstance;
  startIpfsInstance().then((instance) => {
    ipfsInstance = instance;
  });

  let mongoClient;
  startMongoDbInstance().then((instance) => {
    ({ mongoClient } = instance);
  });

  it('should unpin all blocks in IPFS', async () => {
    const ipfsApi = ipfsInstance.getApi();
    const cid = await addPinPacket(ipfsApi);

    const pinsetBefore = await ipfsApi.pin.ls();
    const filterBefore = pinsetBefore.filter(byCid(cid));
    expect(filterBefore.length).to.equal(1);

    const unpinAllPackets = unpinAllPacketsFactory(ipfsApi);
    await unpinAllPackets();

    const pinsetAfter = await ipfsApi.pin.ls();
    const filterAfter = pinsetAfter.filter(byCid(cid));
    expect(filterAfter.length).to.equal(0);
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

  describe('cleanDashDrive', () => {
    let unpinAllPacketsSpy;
    let dropDriveMongoDatabasesSpy;
    beforeEach(function beforeEach() {
      unpinAllPacketsSpy = this.sinon.spy();
      dropDriveMongoDatabasesSpy = this.sinon.spy();
    });

    it('should clean DashDrive', async () => {
      const cleanDashDrive = cleanDashDriveFactory(unpinAllPacketsSpy, dropDriveMongoDatabasesSpy);
      await cleanDashDrive();

      expect(unpinAllPacketsSpy).to.calledOnce();
      expect(dropDriveMongoDatabasesSpy).to.calledOnce();
    });
  });
});
