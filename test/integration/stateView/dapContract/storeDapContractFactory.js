const {
  mocha: {
    startMongoDb,
    startIPFS,
  },
} = require('@dashevo/js-evo-services-ctl');
const getTransitionPacketFixtures = require('../../../../lib/test/fixtures/getTransitionPacketFixtures');
const getTransitionHeaderFixtures = require('../../../../lib/test/fixtures/getTransitionHeaderFixtures');
const DapContractMongoDbRepository = require('../../../../lib/stateView/dapContract/DapContractMongoDbRepository');
const storeDapContractFactory = require('../../../../lib/stateView/dapContract/storeDapContractFactory');
const sanitizeData = require('../../../../lib/mongoDb/sanitizeData');
const doubleSha256 = require('../../../../lib/util/doubleSha256');
const addSTPacketFactory = require('../../../../lib/storage/ipfs/addSTPacketFactory');

describe('storeDapContractFactory', function main() {
  this.timeout(30000);

  let addSTPacket;

  let mongoDbInstance;
  startMongoDb().then((_instance) => {
    mongoDbInstance = _instance;
  });

  let ipfsClient;
  startIPFS().then((_instance) => {
    ipfsClient = _instance.getApi();
  });

  beforeEach(() => {
    addSTPacket = addSTPacketFactory(ipfsClient);
  });

  it('should store DAP schema', async () => {
    const packet = getTransitionPacketFixtures()[0];
    const header = getTransitionHeaderFixtures()[0];

    header.extraPayload.setHashSTPacket(packet.getHash());

    const mongoDb = await mongoDbInstance.getDb();
    const dapContractRepository = new DapContractMongoDbRepository(mongoDb, sanitizeData);
    const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);

    await addSTPacket(packet);

    await storeDapContract(header.getPacketCID());

    const dapId = doubleSha256(packet.dapcontract);
    const dapContract = await dapContractRepository.find(dapId);

    expect(dapContract.getDapId()).to.equal(dapId);
    expect(dapContract.getDapName()).to.equal(packet.dapcontract.dapname);
    expect(dapContract.getSchema()).to.deep.equal(packet.dapcontract.dapschema);
  });
});
