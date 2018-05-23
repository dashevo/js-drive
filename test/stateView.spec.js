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
  constructor(dapId, packetHash, contract) {
    this.dapId = dapId;
    this.packetHash = packetHash;
    this.contract = contract;
  }

  getDapId() {
    return this.dapId;
  }

  getContract() {
    return this.contract;
  }

  toJSON() {
    return {
      dapId: this.dapId,
      packetHash: this.packetHash,
      contract: this.contract,
    };
  }
}

class DapContractMongoDbRepository {
  constructor(mongoClient) {
    this.mongoClient = mongoClient.collection('dapContracts');
  }

  async find(dapId) {
    const dapContractData = await this.mongoClient.findOne({ _id: dapId });
    return new DapContract(
      dapContractData.dapId,
      dapContractData.packetHash,
      dapContractData.contract,
    );
  }

  async store(dapContract) {
    return this.mongoClient.updateOne(
      { _id: dapContract.toJSON().dapId },
      { $set: dapContract.toJSON() },
      { upsert: true },
    );
  }
}

function storeDapContractFactory(dapContractRepository, ipfs) {
  return async function storeDapContract(cid) {
    const packetData = await ipfs.dag.get(cid);
    const packet = new StateTransitionPacket(JSON.parse(packetData.value));
    const dapId = packet.dapid;
    const contract = packet.schema;
    const dapContract = new DapContract(dapId, cid, contract);
    await dapContractRepository.store(dapContract);
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
      const packetHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
      const contractData = {};
      const dapContract = new DapContract(dapId, packetHash, contractData);

      const dapContractSerialized = dapContract.toJSON();
      expect(dapContractSerialized)
        .to
        .deep
        .equal({
          dapId,
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
      const packetHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';
      const contractData = {};
      const dapContract = new DapContract(dapId, packetHash, contractData);

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
      ipfsClient = _instance;
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
        hashAlg: 'sha2-256'
      });

      const cid = stHeader.getPacketCID();
      await storeDapContract(cid);

      const dapId = packet.data.dapid;
      const dapContract = await dapContractRepository.find(dapId);

      expect(dapContract.getDapId()).to.equal(dapId);
      expect(dapContract.getContract()).to.deep.equal(packet.schema);
    });
  });
});
