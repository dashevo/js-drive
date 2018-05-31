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

class DapContract {
  /**
   * @param {string} dapId
   * @param {string} dapName
   * @param {string} packetHash
   * @param {object} contract
   */
  constructor(dapId, dapName, packetHash, contract) {
    this.dapId = dapId;
    this.dapName = dapName;
    this.packetHash = packetHash;
    this.contract = contract;
  }

  getDapId() {
    return this.dapId;
  }

  getDapName() {
    return this.dapName;
  }

  getContract() {
    return this.contract;
  }

  /**
   * Get DapContract JSON representation
   *
   * @returns {{dapId: (string), dapName: (string), packetHash: (string), contract: (Object)}}
   */
  toJSON() {
    return {
      dapId: this.dapId,
      dapName: this.dapName,
      packetHash: this.packetHash,
      contract: this.contract,
    };
  }
}

class DapContractMongoDbRepository {
  /**
   * @param {Db} mongoClient
   */
  constructor(mongoClient) {
    this.mongoClient = mongoClient.collection('dapContracts');
  }

  /**
   * Find DapContract by dapId
   *
   * @param {string} dapId
   * @returns {Promise<DapContract>}
   */
  async find(dapId) {
    const dapContractData = await this.mongoClient.findOne({ _id: dapId });
    return new DapContract(
      dapContractData.dapId,
      dapContractData.dapName,
      dapContractData.packetHash,
      dapContractData.contract,
    );
  }

  /**
   * Store DapContract entity
   *
   * @param {DapContract} dapContract
   * @returns {Promise}
   */
  async store(dapContract) {
    return this.mongoClient.updateOne(
      { _id: dapContract.toJSON().dapId },
      { $set: dapContract.toJSON() },
      { upsert: true },
    );
  }
}

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
    const contract = packet.schema;
    const dapContract = new DapContract(dapId, dapName, cid, contract);
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
  describe('DapContract', () => {
    it('should serialize DapContract', () => {
      const dapId = 123456;
      const dapName = 'DashPay';
      const packetHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
      const contractData = {};
      const dapContract = new DapContract(dapId, dapName, packetHash, contractData);

      const dapContractSerialized = dapContract.toJSON();
      expect(dapContractSerialized).to.deep.equal({
        dapId,
        dapName,
        packetHash,
        contract: contractData,
      });
    });
  });

  describe('DapContractRepository', () => {
    let mongoDbInstance;
    startMongoDbInstance().then((_instance) => {
      mongoDbInstance = _instance;
    });

    it('should store DapContract entity', async () => {
      const dapId = 123456;
      const dapName = 'DashPay';
      const packetHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
      const contractData = {};
      const dapContract = new DapContract(dapId, dapName, packetHash, contractData);

      const mongoClient = await mongoDbInstance.getMongoClient();
      const dapContractRepository = new DapContractMongoDbRepository(mongoClient);
      await dapContractRepository.store(dapContract);
      const contract = await dapContractRepository.find(dapId);

      expect(contract.toJSON()).to.deep.equal(dapContract.toJSON());
    });
  });

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

    it('should store DAP contract', async () => {
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
      expect(dapContract.getContract()).to.deep.equal(packet.schema);
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
