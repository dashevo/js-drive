const Revisions = require('../revisions/Revisions');

class SVObject extends Revisions {
  /**
   * @param {string} userId
   * @param {Document} document
   * @param {Reference} reference
   * @param {boolean} [isDeleted]
   * @param {array} [previousRevisions]
   */
  constructor(userId, document, reference, isDeleted = false, previousRevisions = []) {
    super(reference, previousRevisions);

    this.userId = userId;
    this.document = document;
    this.deleted = isDeleted;
  }

  /**
   * Get user ID
   *
   * @return {string}
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Get Document
   *
   * @return {Document}
   */
  getDocument() {
    return this.document;
  }

  /**
   * Mark object as deleted
   *
   * @return {SVObject}
   */
  markAsDeleted() {
    this.deleted = true;

    return this;
  }

  /**
   * Is object deleted?
   *
   * @return {boolean}
   */
  isDeleted() {
    return this.deleted;
  }

  /**
   * Get revision number
   *
   * @private
   * @return {number}
   */
  getRevisionNumber() {
    return this.getDocument().getRevision();
  }

  /**
   * Return SV Object as plain object
   *
   * @return {{reference: {
   *            blockHash: string,
   *            blockHeight: number,
   *            stHash: string,
   *            stPacketHash: string,
   *            hash: string
   *           },
   *           isDeleted: boolean,
   *           userId: string,
   *           document: { $scope, $action, $scopeId, $rev, $type },
   *           previousRevisions: {
   *            revision: number,
   *            reference: {
   *              blockHash: string,
   *              blockHeight: number,
   *              stHash: string,
   *              stPacketHash: string,
   *              hash: string
   *            }
   *           }[]}}
   */
  toJSON() {
    return {
      userId: this.getUserId(),
      isDeleted: this.isDeleted(),
      document: this.getDocument().toJSON(),
      reference: this.getReference().toJSON(),
      previousRevisions: this.getPreviousRevisions().map(r => r.toJSON()),
    };
  }
}

module.exports = SVObject;
