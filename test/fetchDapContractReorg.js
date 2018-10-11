const Reference = require('../lib/stateView/Reference');
const DapContract = require('../lib/stateView/dapContract/DapContract');
const DapContractMongoDbRepository = require('../lib/stateView/dapContract/DapContractMongoDbRepository');
const getBlockFixtures = require('../lib/test/fixtures/getBlockFixtures');
const getTransitionPacketFixtures = require('../lib/test/fixtures/getTransitionPacketFixtures');
const getTransitionHeaderFixtures = require('../lib/test/fixtures/getTransitionHeaderFixtures');
const sanitizeData = require('../lib/mongoDb/sanitizeData');
const {
  mocha: {
    startMongoDb,
    startIPFS,
  },
} = require('@dashevo/js-evo-services-ctl');
const RpcClientMock = require('../lib/test/mock/RpcClientMock');
const addSTPacketFactory = require('../lib/storage/ipfs/addSTPacketFactory');
const updateDapContractFactory = require('../lib/stateView/dapContract/updateDapContractFactory');
const applyStateTransitionFactory = require('../lib/stateView/applyStateTransitionFactory');
const doubleSha256 = require('../lib/util/doubleSha256');

function applyDapContractReorgFactory(dapContractMongoDbRepository, rpcClient, applyStateTransition) {
  async function applyDapContractReorg(staleBlock) {
    const dapContract = await dapContractMongoDbRepository.findByReferenceBlockHash(staleBlock.hash);
    const previousVersions = dapContract.getPreviousVersions();

    for (let i = 0; i < previousVersions.length; i++) {
      const previousVersionReference = previousVersions[i].reference;
      const block = await rpcClient.getBlock(previousVersionReference.blockHash);
      const header = await rpcClient.getTransaction(previousVersionReference.stHeaderHash);
      await applyStateTransition(header, block);
    }
  }
  return applyDapContractReorg;
}

describe('applyDapContractReorgFactory', () => {
  // 1 2 3 4 5 6 7 8
  //         5 6 7 8 9 10

  let mongoDb;
  startMongoDb().then(async (mongoDbInstance) => {
    mongoDb = await mongoDbInstance.getDb();
  });

  let ipfsClient;
  startIPFS().then(async (ipfsInstance) => {
    ipfsClient = await ipfsInstance.getApi();
  });

  let addSTPacket;
  let dapContractMongoDbRepository;
  let applyStateTransition;
  beforeEach(() => {
    addSTPacket = addSTPacketFactory(ipfsClient);
    dapContractMongoDbRepository = new DapContractMongoDbRepository(mongoDb, sanitizeData);
    const updateDapContract = updateDapContractFactory(dapContractMongoDbRepository);
    applyStateTransition = applyStateTransitionFactory(
      ipfsClient,
      updateDapContract,
      null,
    );
  });

  let rpcClientMock;
  beforeEach(function beforeEach() {
    rpcClientMock = new RpcClientMock(this.sinon);
  });

  it('...with versions', async () => {
    const dapId = '1234';
    const dapName = 'DashPay';

    const versionOneBlock = getBlockFixtures()[0];
    const versionOnePacket = getTransitionPacketFixtures()[0];
    versionOnePacket.dapcontract.dapver = 1;
    const versionOneHeader = getTransitionHeaderFixtures()[0];
    versionOneHeader.extraPayload.hashSTPacket = versionOnePacket.getHash();

    await addSTPacket(versionOnePacket);

    const lastVersionBlock = getBlockFixtures()[1];
    const lastVersionPacket = getTransitionPacketFixtures()[0];
    lastVersionPacket.dapcontract.upgradedapid = doubleSha256(versionOnePacket.dapcontract);
    lastVersionPacket.dapcontract.dapver = 2;
    const lastVersionHeader = getTransitionHeaderFixtures()[1];
    lastVersionHeader.extraPayload.hashSTPacket = lastVersionPacket.getHash();

    await addSTPacket(lastVersionPacket);

    const lastVersionBlockHash = lastVersionBlock.hash;
    const lastVersionBlockHeight = lastVersionBlock.height;
    const lastVersionStHeaderHash = '';
    const lastVersionStPacketHash = '';
    const lastVersionObjectHash = '';
    const lastReference = new Reference(
      lastVersionBlockHash,
      lastVersionBlockHeight,
      lastVersionStHeaderHash,
      lastVersionStPacketHash,
      lastVersionObjectHash,
    );
    const schema = {};
    const version = 2;

    const versionOneBlockHash = versionOneBlock.hash;
    const versionOneBlockHeight = versionOneBlock.height;
    const versionOneStHeaderHash = '';
    const versionOneStPacketHash = '';
    const versionOneObjectHash = '';
    const previousVersions = [
      {
        version: 1,
        reference: new Reference(
          versionOneBlockHash,
          versionOneBlockHeight,
          versionOneStHeaderHash,
          versionOneStPacketHash,
          versionOneObjectHash,
        ),
      }
    ];
    const dapContract = new DapContract(
      dapId,
      dapName,
      lastReference,
      schema,
      version,
      previousVersions,
    );
    await dapContractMongoDbRepository.store(dapContract);


    const applyDapContractReorg = applyDapContractReorgFactory(
      dapContractMongoDbRepository,
      rpcClientMock,
      applyStateTransition,
    );
    await applyDapContractReorg(lastVersionBlock);

    const dapContractAfter = await dapContractMongoDbRepository.find(dapId);
    expect(dapContractAfter.getVersion()).to.be.equal(1);
    expect(dapContractAfter.getPreviousVersions()).to.be.deep.equal([]);
  });

  it('should delete DapContract if there are no versions', async () => {
    const dapId = '1234';
    const dapName = 'DashPay';

    const block = getBlockFixtures()[0];
    const blockHash = block.hash;
    const blockHeight = block.height;
    const stHeaderHash = '';
    const stPacketHash = '';
    const objectHash = '';
    const reference = new Reference(
      blockHash,
      blockHeight,
      stHeaderHash,
      stPacketHash,
      objectHash,
    );
    const schema = {};
    const version = 2;
    const previousVersions = [];
    const dapContract = new DapContract(
      dapId,
      dapName,
      reference,
      schema,
      version,
      previousVersions,
    );
    await dapContractMongoDbRepository.store(dapContract);

    const applyDapContractReorg = applyDapContractReorgFactory(dapContractMongoDbRepository);
    const staleBlock = block;
    await applyDapContractReorg(staleBlock);

    const dapContractAfter = await dapContractMongoDbRepository.find(dapId);
    expect(dapContractAfter.getDapId()).to.not.exist();
  });
});
