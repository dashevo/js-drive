const Revisions = require('../revisions/Revisions');

/**
 * @param {DataContract} contract
 * @param {Reference} reference
 * @param {boolean} [isDeleted=false]
 * @param {array} [previousRevisions=[]]
 */
class SVContract extends Revisions {
  constructor(
    contract,
    reference,
    isDeleted = false,
    previousRevisions = [],
  ) {
    super(reference, previousRevisions);

    this.contract = contract;
    this.deleted = isDeleted;
  }

  /**
   * Get Contract
   *
   * @return {DataContract}
   */
  getContract() {
    return this.contract;
  }

  /**
   * Is contract deleted?
   *
   * @return {boolean}
   */
  isDeleted() {
    return this.deleted;
  }

  /**
   * Mark contract as deleted
   *
   * @return {SVContract}
   */
  markAsDeleted() {
    this.deleted = true;

    return this;
  }

  /**
   * Return SV Contract as plain object
   *
   * @return {{reference: {
   *            blockHash: string,
   *            blockHeight: number,
   *            stHash: string,
   *            stPacketHash: string,
   *            hash: string
   *          },
   *          isDeleted: boolean,
   *          contractId: string,
   *          previousRevisions: {
   *            revision: number,
   *            reference: {
   *              blockHash: string,
   *              blockHeight: number,
   *              stHash: string,
   *              stPacketHash: string,
   *              hash: string
   *            }
   *          }[],
   *          contract: RawContract
   *          }}
   */
  toJSON() {
    return {
      contractId: this.getContract().getContractId(),
      reference: this.reference.toJSON(),
      contract: this.getContract().toJSON(),
      isDeleted: this.isDeleted(),
      previousRevisions: this.getPreviousRevisions().map(r => r.toJSON()),
    };
  }

  /**
   * Get revision number
   *
   * @private
   * @return {number}
   */
  getRevisionNumber() {
    return this.getContract().getVersion();
  }
}

module.exports = SVContract;
