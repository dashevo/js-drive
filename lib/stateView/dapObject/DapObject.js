const generateDapObjectId = require('./generateDapObjectId');

class DapObject {
  /**
   * @param {string} blockchainUserId
   * @param {object} data
   * @param {Reference} reference
   * @param {array} previousVersions
   */
  constructor(blockchainUserId, data, reference, previousVersions = []) {
    this.blockchainUserId = blockchainUserId;
    this.type = data.objtype;
    this.object = data;
    this.version = data.rev;
    this.reference = reference;
    this.previousVersions = previousVersions;
  }

  getId() {
    return generateDapObjectId(this.blockchainUserId, this.object.idx);
  }

  getAction() {
    return this.object.act;
  }

  getPreviousVersions() {
    return this.previousVersions;
  }

  currentRevision() {
    return {
      version: this.version,
      reference: this.reference,
    };
  }

  addRevision(previousDapObject) {
    this.previousVersions = this.previousVersions
      .concat(previousDapObject.getPreviousVersions())
      .concat([previousDapObject.currentRevision()]);
  }

  toJSON() {
    return {
      blockchainUserId: this.blockchainUserId,
      type: this.type,
      object: this.object,
      version: this.version,
      reference: this.reference.toJSON(),
      previousVersions: this.previousVersionsToJSON(),
    };
  }

  /**
   *
   * @returns {{version: number,
   *            reference: {blockHash, blockHeight, stHeaderHash, stPacketHash, objectHash}}[]}
   */
  previousVersionsToJSON() {
    return this.previousVersions.map(previousRevision => ({
      version: previousRevision.version,
      reference: previousRevision.reference.toJSON(),
    }));
  }
}

DapObject.ACTION_CREATE = 0;
DapObject.ACTION_UPDATE = 1;
DapObject.ACTION_DELETE = 2;

module.exports = DapObject;
