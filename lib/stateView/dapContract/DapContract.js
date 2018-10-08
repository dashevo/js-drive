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
      previousRevisions: this.previousRevisions,
    };
  }
}

module.exports = DapContract;
