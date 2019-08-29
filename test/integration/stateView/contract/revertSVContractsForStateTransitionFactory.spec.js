const {
  mocha: {
    startMongoDb,
  },
} = require('@dashevo/dp-services-ctl');

const DashPlatformProtocol = require('@dashevo/dpp');

const Revision = require('../../../../lib/stateView/revisions/Revision');
const Reference = require('../../../../lib/stateView/revisions/Reference');
const SVContract = require('../../../../lib/stateView/contract/SVContract');
const SVContractMongoDbRepository = require('../../../../lib/stateView/contract/SVContractMongoDbRepository');

const getBlocksFixture = require('../../../../lib/test/fixtures/getBlocksFixture');
const getSTPacketsFixture = require('../../../../lib/test/fixtures/getSTPacketsFixture');
const getStateTransitionsFixture = require('../../../../lib/test/fixtures/getStateTransitionsFixture');
const getSVContractFixture = require('../../../../lib/test/fixtures/getSVContractFixture');
const getDocumentsFixture = require('../../../../lib/test/fixtures/getDocumentsFixture');

const updateSVContractFactory = require('../../../../lib/stateView/contract/updateSVContractFactory');
const revertSVContractsForStateTransitionFactory = require('../../../../lib/stateView/contract/revertSVContractsForStateTransitionFactory');
const applyStateTransitionFactory = require('../../../../lib/stateView/applyStateTransitionFactory');
const applyStateTransitionFromReferenceFactory = require('../../../../lib/stateView/applyStateTransitionFromReferenceFactory');

describe('revertSVContractsForStateTransitionFactory', () => {
  let svContractMongoDbRepository;
  let applyStateTransition;
  let revertSVContractsForStateTransition;
  let mongoDatabase;
  let userId;

  startMongoDb().then((mongoDb) => {
    mongoDatabase = mongoDb.getDb();
  });

  beforeEach(() => {
    ({ userId } = getDocumentsFixture);

    const dpp = new DashPlatformProtocol({
      dataProvider: {},
    });

    svContractMongoDbRepository = new SVContractMongoDbRepository(mongoDatabase, dpp);

    const updateSVContract = updateSVContractFactory(svContractMongoDbRepository);

    applyStateTransition = applyStateTransitionFactory(
      updateSVContract,
      null,
    );

    const applyStateTransitionFromReference = applyStateTransitionFromReferenceFactory(
      applyStateTransition,
    );

    revertSVContractsForStateTransition = revertSVContractsForStateTransitionFactory(
      svContractMongoDbRepository,
      applyStateTransition,
      applyStateTransitionFromReference,
    );
  });

  it('should remove last version of SV Contract and re-apply previous versions in order', async () => {
    // 1. Store 3 versions of Contracts
    const contractVersions = [];

    const blocks = getBlocksFixture();
    const stateTransitions = getStateTransitionsFixture();
    const [stPacket] = getSTPacketsFixture();

    const contractId = stPacket.getContractId();
    const contract = stPacket.getContract();

    for (let i = 0; i < 3; i++) {
      const block = blocks[i];
      const stateTransition = stateTransitions[i];

      contract.setVersion(i + 1);

      stateTransition.extraPayload.hashSTPacket = stPacket.hash();

      const reference = new Reference({
        blockHash: block.hash,
        blockHeight: block.height,
        stHash: stateTransition.hash,
        stPacketHash: stPacket.hash(),
        hash: contract.hash(),
      });

      contractVersions.push({
        version: (i + 1),
        block,
        stateTransition,
        stPacket,
        reference,
      });
    }

    // 2. Create ans store SV Contract
    const previousRevisions = contractVersions.slice(0, 2)
      .map(({ version, reference }) => (
        new Revision(version, reference)
      ));

    const svContract = new SVContract(
      contractId,
      userId,
      contract,
      contractVersions[contractVersions.length - 1].reference,
      false,
      previousRevisions,
    );

    await svContractMongoDbRepository.store(svContract);

    // 3. Revert 3rd version of contract to 2nd
    const thirdContractVersion = contractVersions[contractVersions.length - 1];

    await revertSVContractsForStateTransition({
      stateTransition: thirdContractVersion.stateTransition,
      block: thirdContractVersion.block,
    });

    const revertedSVContract = await svContractMongoDbRepository.find(contractId);

    expect(revertedSVContract.getContract().getVersion()).to.equal(2);

    expect(revertedSVContract.getPreviousRevisions()).to.deep.equal([
      previousRevisions[0],
    ]);
  });

  it('should delete SV Contract if there are no previous versions', async () => {
    const svContract = getSVContractFixture();
    const [stateTransition] = getStateTransitionsFixture();
    const [block] = getBlocksFixture();

    const contractId = svContract.getContractId();

    await svContractMongoDbRepository.store(svContract);

    await revertSVContractsForStateTransition({
      stateTransition,
      block,
    });

    const revertedSVContract = await svContractMongoDbRepository.find(contractId);

    expect(revertedSVContract).to.not.exist();
  });
});
