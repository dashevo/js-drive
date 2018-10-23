const { mocha: { startIPFS, startMongoDb } } = require('@dashevo/js-evo-services-ctl');

const DapContract = require('../../../../lib/stateView/dapContract/DapContract');
const DapContractMongoDbRepository = require('../../../../lib/stateView/dapContract/DapContractMongoDbRepository');

const doubleSha256 = require('../../../../lib/util/doubleSha256');
const sanitizeData = require('../../../../lib/mongoDb/sanitizeData');

const addSTPacketFactory = require('../../../../lib/storage/ipfs/addSTPacketFactory');
const getTransitionPacketFixtures = require('../../../../lib/test/fixtures/getTransitionPacketFixtures');

describe('addSTPacket', () => {
  let ipfsApi;
  let mongoDb;
  let addSTPacket;
  let dapContractMongoDbRepository;

  startIPFS().then((_instance) => {
    ipfsApi = _instance.getApi();
  });

  startMongoDb().then((_instance) => {
    mongoDb = _instance.getDb();
  });

  beforeEach(() => {
    dapContractMongoDbRepository = new DapContractMongoDbRepository(mongoDb, sanitizeData);

    addSTPacket = addSTPacketFactory(ipfsApi, dapContractMongoDbRepository);
  });

  it('should add packets to storage and returns hash', async () => {
    const packets = getTransitionPacketFixtures();

    dapContractMongoDbRepository.store(
      DapContract.createFromPacket(packets[0]),
    );

    const addPacketsPromises = packets.map(addSTPacket);
    const packetsCids = await Promise.all(addPacketsPromises);

    // 1. Packets should be available in IPFS
    // eslint-disable-next-line arrow-body-style
    const packetsPromisesFromIPFS = packetsCids.map((packetCid) => {
      return ipfsApi.dag.get(packetCid);
    });

    const packetsFromIPFS = await Promise.all(packetsPromisesFromIPFS);

    // 2. Packets should have the same data
    const packetFromIPFS = packetsFromIPFS.map(packet => packet.value);

    const packetsData = packets.map(packet => packet.toJSON({ skipMeta: true }));

    expect(packetsData).to.deep.equal(packetFromIPFS);
  });
});
