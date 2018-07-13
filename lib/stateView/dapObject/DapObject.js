class DapObject {
  /**
   * @param {Reference} reference
   * @param {object} data
   */
  constructor(reference, data) {
    this.id = data.id;
    this.type = data.objtype;
    this.object = data;
    this.revision = data.rev;
    this.reference = reference;
  }

  isNew() {
    return this.object && this.object.act === 0;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      object: this.object,
      revision: this.revision,
      reference: this.reference.toJSON(),
    };
  }
}

module.exports = DapObject;
