const getTransitionPacketFixtures = require('../../../../lib/test/fixtures/getTransitionPacketFixtures');
const doubleSha256 = require('../../../../lib/util/doubleSha256');
const Reference = require('../../../../lib/stateView/Reference');
const DapContract = require('../../../../lib/stateView/dapContract/DapContract');
const { mocha: { startMongoDb } } = require('@dashevo/js-evo-services-ctl');
const sanitizeData = require('../../../../lib/mongoDb/sanitizeData');
const DapContractMongoDbRepository = require('../../../../lib/stateView/dapContract/DapContractMongoDbRepository');
const updateDapContractFactory = require('../../../../lib/stateView/dapContract/updateDapContractFactory');

describe('updateDapContractFactory', () => {
  const blockHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
  const blockHeight = 1;
  const headerHash = '17jasdjk129uasd8asd023098SD09023jll123jlasd90823jklD';
  const hashSTPacket = 'ad877138as8012309asdkl123l123lka908013';
  const objectHash = '123981as90d01309ad09123';

  let mongoDb;
  startMongoDb().then(async (mongoDbInstance) => {
    mongoDb = await mongoDbInstance.getDb();
  });

  let dapContractRepository;
  let updateDapContract;
  beforeEach(() => {
    dapContractRepository = new DapContractMongoDbRepository(mongoDb, sanitizeData);
    updateDapContract = updateDapContractFactory(dapContractRepository);
  });

  it('should store DapContract', async () => {
    const packet = getTransitionPacketFixtures()[0];
    const dapContractData = packet.dapcontract;
    const dapId = doubleSha256(dapContractData);
    const reference = new Reference(
      blockHash,
      blockHeight,
      headerHash,
      hashSTPacket,
      objectHash,
    );

    await updateDapContract(dapId, reference, dapContractData);

    const dapContract = await dapContractRepository.find(dapId);
    expect(dapContract.getSchema()).to.deep.equal(dapContractData.dapschema);
    expect(dapContract.getVersion()).to.deep.equal(dapContractData.dapver);
  });

  it('should maintain DapContract previous revisions and add new one', async () => {
    const dapId = '123456';
    const dapName = 'DashPay';
    const reference = new Reference();
    const schema = {};
    const version = 2;
    const firstRevision = {
      version: 1,
      reference,
    };
    const previousRevisions = [firstRevision];
    const previousDapContract = new DapContract(
      dapId,
      dapName,
      reference,
      schema,
      version,
      previousRevisions,
    );
    await dapContractRepository.store(previousDapContract);

    const packet = getTransitionPacketFixtures()[0];
    const newDapContractData = packet.dapcontract;
    newDapContractData.dapver = 3;
    newDapContractData.upgradedapid = dapId;
    const newDapId = doubleSha256(newDapContractData);
    const newReference = new Reference();

    await updateDapContract(newDapId, newReference, newDapContractData);
    const currentDapContract = await dapContractRepository.find(newDapId);
    const oldDapContract = await dapContractRepository.find(dapId);

    expect(currentDapContract.getSchema()).to.deep.equal(newDapContractData.dapschema);
    expect(currentDapContract.getVersion()).to.deep.equal(newDapContractData.dapver);
    expect(currentDapContract.getPreviousRevisions()).to.deep.equal([
      firstRevision,
      previousDapContract.getRevision(),
    ]);
    expect(oldDapContract.getDapId()).to.not.exist();
  });
});
