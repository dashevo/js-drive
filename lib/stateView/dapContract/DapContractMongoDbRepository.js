const Reference = require('../Reference');
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

    const previousRevisions = this.toPreviousRevisions(dapContractData.previousRevisions);
    return this.toDapContract(dapContractData, dapContractData.reference, previousRevisions);
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

  /**
   * Delete DapContract entity
   *
   * @param {DapContract} dapContract
   * @returns {Promise}
   */
  async delete(dapContract) {
    return this.collection.deleteOne({ _id: dapContract.dapId });
  }

  /**
   * @private
   * @param {object} dapContractData
   * @param {object} referenceData
   * @param {array} previousRevisions
   * @returns {DapContract}
   */
  toDapContract(dapContractData = {}, referenceData = {}, previousRevisions = []) {
    const reference = new Reference(
      referenceData.blockHash,
      referenceData.blockHeight,
      referenceData.stHeaderHash,
      referenceData.stPacketHash,
      referenceData.objectHash,
    );
    return new DapContract(
      dapContractData.dapId,
      dapContractData.dapName,
      reference,
      dapContractData.schema,
      dapContractData.version,
      previousRevisions,
    );
  }

  /**
   * @private
   * @param {array} previousRevisionsData
   * @returns {{version: number, reference: Reference}[]}
   */
  toPreviousRevisions(previousRevisionsData = []) {
    return previousRevisionsData.map((previousRevision) => {
      const previousVersion = previousRevision.version;
      const previousReferenceData = previousRevision.reference;
      return {
        version: previousVersion,
        reference: new Reference(
          previousReferenceData.blockHash,
          previousReferenceData.blockHeight,
          previousReferenceData.stHeaderHash,
          previousReferenceData.stPacketHash,
          previousReferenceData.objectHash,
        ),
      };
    });
  }
}

module.exports = DapContractMongoDbRepository;
