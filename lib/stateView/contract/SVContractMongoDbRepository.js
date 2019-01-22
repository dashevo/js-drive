const bs58 = require('bs58');
const mongo = require('mongodb');

const SVContract = require('./SVContract');
const Reference = require('../revisions/Reference');

const createRevisions = require('../revisions/createRevisions');

/**
 * Create Base58 Database ID from DAP ID
 *
 * @private
 * @param {string} contractId
 *
 * @return {string}
 */
function createDocumentIdFromContractId(contractId) {
  return bs58.encode(Buffer.from(contractId, 'hex'));
}

class SVContractMongoDbRepository {
  /**
   * @param {Db} mongoDb
   * @param {DashPlatformProtocol} dpp
   */
  constructor(mongoDb, dpp) {
    this.collection = mongoDb.collection('contracts');
    this.dpp = dpp;
  }

  /**
   * Find DapContract by contractId
   *
   * @param {string} contractId
   * @returns {Promise<SVContract|null>}
   */
  async find(contractId) {
    const documentId = createDocumentIdFromContractId(contractId);

    const result = await this.collection.findOne({
      _id: documentId,
      isDeleted: false,
    });

    if (!result) {
      return null;
    }

    return this.createSVContract(result);
  }

  /**
   * Find list of DapContract by `reference.stHeaderHash`
   *
   * @param {string} hash
   * @returns {Promise<SVContract[]|null>}
   */
  async findAllByReferenceSTHeaderHash(hash) {
    const result = await this.collection.find({ 'reference.stHeaderHash': hash })
      .toArray();

    return result.map(document => this.createSVContract(document));
  }

  /**
   * Store DapContract entity
   *
   * @param {SVContract} svContract
   * @returns {Promise}
   */
  async store(svContract) {
    const rawSVContract = svContract.toJSON();

    rawSVContract.dpContract = mongo.Binary(
      svContract.getDPContract().serialize(),
    );

    const documentId = createDocumentIdFromContractId(svContract.getContractId());

    return this.collection.updateOne(
      { _id: documentId },
      { $set: rawSVContract },
      { upsert: true },
    );
  }

  /**
   * Delete DapContract entity
   *
   * @param {SVContract} svContract
   * @returns {Promise}
   */
  async delete(svContract) {
    const documentId = createDocumentIdFromContractId(svContract.getContractId());

    return this.collection.deleteOne({ _id: documentId });
  }

  /**
   * @typedef createSVContract
   * @param {Object} rawSVContract
   * @returns {SVContract}
   */
  createSVContract({
    contractId,
    dpContract: serializedRawDPContract,
    reference,
    isDeleted,
    previousRevisions,
  }) {
    const dpContract = this.dpp.contract.createFromSerialized(serializedRawDPContract.buffer);

    return new SVContract(
      contractId,
      dpContract,
      new Reference(reference),
      isDeleted,
      createRevisions(previousRevisions),
    );
  }
}

module.exports = SVContractMongoDbRepository;