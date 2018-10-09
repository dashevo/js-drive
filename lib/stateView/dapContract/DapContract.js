class DapContract {
  /**
   * @param {string} dapId
   * @param {string} dapName
   * @param {Reference} reference
   * @param {object} schema
   * @param {number} version
   * @param {array} previousRevisions
   */
  constructor(dapId, dapName, reference, schema, version, previousRevisions = []) {
    this.dapId = dapId;
    this.dapName = dapName;
    this.reference = reference;
    this.schema = schema;
    this.version = version;
    this.previousRevisions = previousRevisions;
  }

  getDapId() {
    return this.dapId;
  }

  getDapName() {
    return this.dapName;
  }

  getSchema() {
    return this.schema;
  }

  getVersion() {
    return this.version;
  }

  getPreviousRevisions() {
    return this.previousRevisions;
  }

  currentRevision() {
    return {
      version: this.version,
      reference: this.reference,
    };
  }

  addRevision(previousDapContract) {
    this.previousRevisions = this.previousRevisions
      .concat(previousDapContract.getPreviousRevisions())
      .concat([previousDapContract.currentRevision()]);
  }

  /**
   * Get DapContract JSON representation
   *
   * @returns {{dapId: string, dapName: string, reference: Object,
   *              schema: Object, version: number, previousRevisions: array}}
   */
  toJSON() {
    return {
      dapId: this.dapId,
      dapName: this.dapName,
      reference: this.reference.toJSON(),
      schema: this.schema,
      version: this.version,
      previousRevisions: this.previousRevisionsToJSON(),
    };
  }

  /**
   * @private
   * @returns {{version: number,
   *            reference: {blockHash, blockHeight, stHeaderHash, stPacketHash, objectHash}}[]}
   */
  previousRevisionsToJSON() {
    return this.previousRevisions.map(previousRevision => ({
      version: previousRevision.version,
      reference: previousRevision.reference.toJSON(),
    }));
  }
}

module.exports = DapContract;
