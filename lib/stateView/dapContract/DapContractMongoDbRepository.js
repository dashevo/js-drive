const Reference = require('../Reference')
const DapContract = require('./DapContract');

class DapContractMongoDbRepository {
  /**
   * @param {Db} mongoDb
   * @param {sanitizeData} sanitizeData
   */
  constructor(mongoDb, { sanitize, unsanitize }) {
    this.collection = mongoDb.collection('dapContracts');
    this.sanitize = sanitize;
    this.unsanitize = unsanitize;
  }

  /**
   * Find DapContract by dapId
   *
   * @param {string} dapId
   * @returns {Promise<DapContract>}
   */
  async find(dapId) {
    const result = await this.collection.findOne({ _id: dapId });
    const dapContractData = this.unsanitize(result || {});
    const referenceData = dapContractData.reference || {};
    const reference = new Reference(
      referenceData.blockHash,
      referenceData.blockHeight,
      referenceData.stHeaderHash,
      referenceData.stPacketHash,
    );
    return new DapContract(
      dapContractData.dapId,
      dapContractData.dapName,
      reference,
      dapContractData.schema,
      dapContractData.version,
    );
  }

  /**
   * Store DapContract entity
   *
   * @param {DapContract} dapContract
   * @returns {Promise}
   */
  async store(dapContract) {
    const dapContractData = dapContract.toJSON();

    return this.collection.updateOne(
      { _id: dapContractData.dapId },
      { $set: this.sanitize(dapContractData) },
      { upsert: true },
    );
  }
}

module.exports = DapContractMongoDbRepository;
