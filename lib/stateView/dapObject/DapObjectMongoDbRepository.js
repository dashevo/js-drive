const DapObject = require('./DapObject');
const Reference = require('../Reference');

class DapObjectMongoDbRepository {
  /**
   * @param {Db} mongoClient
   */
  constructor(mongoClient) {
    this.mongoClient = mongoClient.collection('dapObjects');
  }

  /**
   * Find DapObject by id
   *
   * @param {string} id
   * @returns {Promise<DapObject>}
   */
  async find(id) {
    const result = await this.mongoClient.findOne({ _id: id });
    const dapObject = result || {};
    const referenceData = dapObject.reference || {};
    const reference = new Reference(
      referenceData.blockHash,
      referenceData.blockHeight,
      referenceData.stHeaderHash,
      referenceData.stPacketHash,
      referenceData.objectHash,
    );
    const objectData = {
      id: dapObject.id,
      actn: dapObject.actn,
      objtype: dapObject.type,
      revn: dapObject.revision,
    };
    return new DapObject(reference, objectData);
  }

  /**
   * Store DapObject entity
   *
   * @param {DapObject} dapObject
   * @returns {Promise}
   */
  store(dapObject) {
    return this.mongoClient.updateOne(
      { _id: dapObject.toJSON().id },
      { $set: dapObject.toJSON() },
      { upsert: true },
    );
  }
}

module.exports = DapObjectMongoDbRepository;
