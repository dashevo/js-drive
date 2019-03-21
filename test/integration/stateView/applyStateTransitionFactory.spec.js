const {
  mocha: {
    startMongoDb,
    startIPFS,
  },
} = require('@dashevo/dp-services-ctl');

const DashPlatformProtocol = require('@dashevo/dpp');

const DriveDataProvider = require('../../../lib/dpp/DriveDataProvider');

const Reference = require('../../../lib/stateView/revisions/Reference');

const sanitizer = require('../../../lib/mongoDb/sanitizer');

const createSVObjectMongoDbRepositoryFactory = require('../../../lib/stateView/object/createSVObjectMongoDbRepositoryFactory');
const SVObjectMongoDbRepository = require('../../../lib/stateView/object/SVObjectMongoDbRepository');
const SVContractMongoDbRepository = require('../../../lib/stateView/contract/SVContractMongoDbRepository');
const updateSVContractFactory = require('../../../lib/stateView/contract/updateSVContractFactory');
const updateSVObjectFactory = require('../../../lib/stateView/object/updateSVObjectFactory');
const applyStateTransitionFactory = require('../../../lib/stateView/applyStateTransitionFactory');

const fetchContractFactory = require('../../../lib/stateView/contract/fetchContractFactory');
const STPacketIpfsRepository = require('../../../lib/storage/stPacket/STPacketIpfsRepository');

const ReaderMediator = require('../../../lib/blockchain/reader/BlockchainReaderMediator');
const ReaderMediatorMock = require('../../../lib/test/mock/BlockchainReaderMediatorMock');

const getBlocksFixture = require('../../../lib/test/fixtures/getBlocksFixture');
const getSTPacketsFixture = require('../../../lib/test/fixtures/getSTPacketsFixture');
const getStateTransitionsFixture = require('../../../lib/test/fixtures/getStateTransitionsFixture');
const getSVContractFixture = require('../../../lib/test/fixtures/getSVContractFixture');

describe('applyStateTransitionFactory', () => {
  let mongoClient;
  let mongoDatabase;
  let ipfsClient;
  let stPacketRepository;
  let svContractMongoDbRepository;
  let createSVObjectMongoDbRepository;
  let readerMediator;
  let applyStateTransition;

  startMongoDb().then((mongoDb) => {
    mongoClient = mongoDb.getClient();
    mongoDatabase = mongoDb.getDb();
  });

  startIPFS().then((ipfs) => {
    ipfsClient = ipfs.getApi();
  });

  beforeEach(function beforeEach() {
    const dpp = new DashPlatformProtocol();

    svContractMongoDbRepository = new SVContractMongoDbRepository(mongoDatabase, dpp);

    const createFetchContract = () => fetchContractFactory(svContractMongoDbRepository);

    const dataProvider = new DriveDataProvider(
      null,
      createFetchContract,
      null,
    );

    dpp.setDataProvider(dataProvider);

    stPacketRepository = new STPacketIpfsRepository(
      ipfsClient,
      dpp,
      1000,
    );

    createSVObjectMongoDbRepository = createSVObjectMongoDbRepositoryFactory(
      mongoClient,
      SVObjectMongoDbRepository,
      sanitizer,
    );

    const updateSVContract = updateSVContractFactory(svContractMongoDbRepository);
    const updateSVObject = updateSVObjectFactory(createSVObjectMongoDbRepository);
    readerMediator = new ReaderMediatorMock(this.sinon);
    applyStateTransition = applyStateTransitionFactory(
      stPacketRepository,
      updateSVContract,
      updateSVObject,
      readerMediator,
    );
  });

  it('should compute Contract state view', async () => {
    const block = getBlocksFixture()[0];
    const stPacket = getSTPacketsFixture()[0];
    const stateTransition = getStateTransitionsFixture()[0];
    const contractId = stPacket.getContractId();

    stateTransition.extraPayload.hashSTPacket = stPacket.hash();

    const reference = new Reference({
      blockHash: block.hash,
      blockHeight: block.height,
      stHash: stateTransition.hash,
      stPacketHash: stPacket.hash(),
      hash: stPacket.getContract().hash(),
    });

    await stPacketRepository.store(stPacket);

    await applyStateTransition(stateTransition, block);

    expect(readerMediator.emitSerial).to.have.been.calledWith(
      ReaderMediator.EVENTS.CONTRACT_APPLIED,
      {
        userId: stateTransition.extraPayload.regTxId,
        contractId,
        reference,
        contract: stPacket.getContract().toJSON(),
      },
    );

    const svContract = await svContractMongoDbRepository.find(contractId);

    expect(svContract.getContractId()).to.equal(contractId);
    expect(svContract.getContract().toJSON()).to.deep.equal(stPacket.getContract().toJSON());
    expect(svContract.getReference()).to.deep.equal(reference);
    expect(svContract.getPreviousRevisions()).to.deep.equal([]);
  });

  it('should compute DP Objects state view', async () => {
    const svContract = getSVContractFixture();

    svContractMongoDbRepository.store(svContract);

    const block = getBlocksFixture()[1];
    const stPacket = getSTPacketsFixture()[1];
    const stateTransition = getStateTransitionsFixture()[1];

    stateTransition.extraPayload.hashSTPacket = stPacket.hash();

    await stPacketRepository.store(stPacket);

    await applyStateTransition(stateTransition, block);

    expect(readerMediator.emitSerial).to.have.been.calledTwice();

    for (const dpObject of stPacket.getDPObjects()) {
      const svObjectRepository = createSVObjectMongoDbRepository(
        stPacket.getContractId(),
        dpObject.getType(),
      );
      const svObjects = await svObjectRepository.fetch();

      expect(svObjects).to.be.an('array');
      expect(svObjects).to.have.lengthOf(1);

      const [svObject] = svObjects;

      expect(svObject.getDPObject().toJSON()).to.deep.equal(dpObject.toJSON());

      const reference = new Reference({
        blockHash: block.hash,
        blockHeight: block.height,
        stHash: stateTransition.hash,
        stPacketHash: stPacket.hash(),
        hash: dpObject.hash(),
      });

      expect(readerMediator.emitSerial).to.have.been.calledWith(
        ReaderMediator.EVENTS.DP_OBJECT_APPLIED,
        {
          userId: stateTransition.extraPayload.regTxId,
          contractId: stPacket.getContractId(),
          objectId: dpObject.getId(),
          reference,
          object: dpObject.toJSON(),
        },
      );
    }
  });
});
