const StateTransitionHeader = require('../lib/blockchain/StateTransitionHeader');
const StateTransitionPacket = require('../lib/storage/StateTransitionPacket');
const getTransitionPacketFixtures = require('../lib/test/fixtures/getTransitionPacketFixtures');
const getTransitionHeaderFixtures = require('../lib/test/fixtures/getTransitionHeaderFixtures');
const startMongoDbInstance = require('../lib/test/services/mocha/startMongoDbInstance');
const startIPFSInstance = require('../lib/test/services/mocha/startIPFSInstance');

const cbor = require('cbor');
const multihashingAsync = require('multihashing-async');
const multihashes = require('multihashes');
const util = require('util');

const multihashing = util.promisify(multihashingAsync);

const DapContract = require('../lib/stateView/dapContract/DapContract');
const DapContractMongoDbRepository = require('../lib/stateView/dapContract/DapContractMongoDbRepository');
/**
 * @param {DapContractMongoDbRepository} dapContractRepository
 * @param {IpfsAPI} ipfs
 * @returns {storeDapContract}
 */
function storeDapContractFactory(dapContractRepository, ipfs) {
  /**
   * Validate and store DapContract
   *
   * @typedef {Promise} storeDapContract
   * @param {string} cid
   * @retuns {object}
   */
  return async function storeDapContract(cid) {
    const packetData = await ipfs.dag.get(cid);
    const packet = new StateTransitionPacket(JSON.parse(packetData.value));
    const dapId = packet.dapid;
    const dapName = packet.objects[0].data.dapname;
    const schema = packet.schema;
    const dapContract = new DapContract(dapId, dapName, cid, schema);
    return dapContractRepository.store(dapContract);
  };
}

async function hashDataMerkleRoot(packet) {
  const serializedPacket = cbor.encodeCanonical(packet);
  const multihash = await multihashing(serializedPacket, 'sha2-256');
  const decoded = multihashes.decode(multihash);
  return decoded.digest.toString('hex');
}

describe('State view implementation', () => {
  describe('State View', function main() {
    this.timeout(30000);

    let mongoDbInstance;
    startMongoDbInstance().then((_instance) => {
      mongoDbInstance = _instance;
    });

    let ipfsClient;
    startIPFSInstance().then((_instance) => {
      ipfsClient = _instance.getApi();
    });

    it('should store DAP schema', async () => {
      const packet = getTransitionPacketFixtures()[0];
      const header = getTransitionHeaderFixtures()[0].toJSON();
      header.hashDataMerkleRoot = await hashDataMerkleRoot(packet.toJSON());

      const mongoClient = await mongoDbInstance.getMongoClient();
      const dapContractRepository = new DapContractMongoDbRepository(mongoClient);
      const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);
      const stHeader = new StateTransitionHeader(header);

      await ipfsClient.dag.put(packet.toJSON(), {
        format: 'dag-cbor',
        hashAlg: 'sha2-256',
      });

      const cid = stHeader.getPacketCID();
      await storeDapContract(cid);

      const dapId = packet.data.dapid;
      const dapContract = await dapContractRepository.find(dapId);

      expect(dapContract.getDapId()).to.equal(dapId);
      expect(dapContract.getDapName()).to.equal(packet.data.objects[0].data.dapname);
      expect(dapContract.getSchema()).to.deep.equal(packet.schema);
    });
  });
});


describe('State View', () => {
  let dapContractRepository;
  let ipfsClient;
  beforeEach(function beforeEach() {
    dapContractRepository = {
      store: this.sinon.stub(),
    };
    ipfsClient = {
      dag: {
        get: this.sinon.stub(),
      },
    };
  });

  it('should throw an error if IPFS fails', async () => {
    ipfsClient.dag.get.throws(new Error('IpfsError'));
    const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);

    try {
      const cid = 'zdpuB1nHv2ewWb3k5dgm2FNuGsKohuujAg3uWJTopZsrxJiXG';
      await storeDapContract(cid);
    } catch (error) {
      expect(error.message).to.equal('IpfsError');
    }
  });

  xit('should throw an error if StateTransitionPacket fails', async () => {
    ipfsClient.dag.get.returns({ value: { packet: 'shit' } });
    const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);

    try {
      const cid = 'zdpuB1nHv2ewWb3k5dgm2FNuGsKohuujAg3uWJTopZsrxJiXG';
      await storeDapContract(cid);
    } catch (error) {
      expect(error.message).to.equal('InvalidPacket');
    }
  });

  it('should throw an error if DapContractRepository fails', async () => {
    dapContractRepository.store.throws(new Error('RepositoryFails'));
    const packet = getTransitionPacketFixtures()[0];
    ipfsClient.dag.get.returns({ value: packet.toJSON() });
    const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);

    try {
      const cid = 'zdpuB1nHv2ewWb3k5dgm2FNuGsKohuujAg3uWJTopZsrxJiXG';
      await storeDapContract(cid);
    } catch (error) {
      expect(error.message).to.equal('RepositoryFails');
    }
  });

  it('should return to work successfully', async () => {
    const packet = getTransitionPacketFixtures()[0];
    ipfsClient.dag.get.returns({ value: packet.toJSON() });
    const storeDapContract = storeDapContractFactory(dapContractRepository, ipfsClient);

    const cid = 'zdpuB1nHv2ewWb3k5dgm2FNuGsKohuujAg3uWJTopZsrxJiXG';
    await storeDapContract(cid);

    expect(dapContractRepository.store).to.be.calledOnce();
  });
});

/**
 * Store DAP contract handler
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {storeDapContract} storeDapContract
 */
function storeDapContractHandler(stHeadersReader, storeDapContract) {
  stHeadersReader.on('header', async (header) => {
    const cid = header.getPacketCID();
    await storeDapContract(cid);
  });
}

describe('storeDapContractHandler', () => {
  let stHeadersReader;
  let storeDapContract;

  beforeEach(function beforeEach() {
    const header = getTransitionHeaderFixtures()[0];
    stHeadersReader = {
      on: (topic, fn) => fn(header),
    };
    storeDapContract = this.sinon.stub();
    storeDapContractHandler(stHeadersReader, storeDapContract);
  });

  it('should call storeDapContractHandler on new block header', () => {
    expect(storeDapContract).to.be.calledOnce();
  });
});
