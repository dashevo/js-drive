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
    const dapObjectState = result || {};
    const { object: objectState, reference: referenceState } = dapObjectState;
    return this.toDapObject(objectState, referenceState);
  }

  /**
   * Fetch DapObjects by type
   *
   * @param {string} type
   * @returns {Promise<DapObject[]>}
   */
  async fetch(type) {
    const results = await this.mongoClient.find({ type }, {}).toArray();
    return results.map((result) => {
      const dapObjectState = result || {};
      const { object: objectState, reference: referenceState } = dapObjectState;
      return this.toDapObject(objectState, referenceState);
    });
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

  /**
   * Delete DapObject entity
   *
   * @param dapObject
   * @returns {Promise}
   */
  async delete(dapObject) {
    return this.mongoClient.deleteOne({ _id: dapObject.toJSON().id });
  }

  /**
   * @private
   * @return {DapObject}
   */
  // eslint-disable-next-line class-methods-use-this
  toDapObject(objectState = {}, referenceState = {}) {
    const reference = new Reference(
      referenceState.blockHash,
      referenceState.blockHeight,
      referenceState.stHeaderHash,
      referenceState.stPacketHash,
    );
    return new DapObject(objectState, reference);
  }
}

module.exports = DapObjectMongoDbRepository;
