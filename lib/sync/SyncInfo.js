class SyncInfo {
  /**
   * @param {string} lastSyncedBlockHeight
   * @param {string} lastSyncedBlockHash
   * @param {Date} lastSyncAt
   * @param {string} currentBlockHeight
   * @param {string} currentBlockHash
   * @param {string} status
   */
  constructor(
    lastSyncedBlockHeight,
    lastSyncedBlockHash,
    lastSyncAt,
    currentBlockHeight,
    currentBlockHash,
    status,
  ) {
    this.lastSyncedBlockHeight = lastSyncedBlockHeight;
    this.lastSyncedBlockHash = lastSyncedBlockHash;
    this.lastSyncAt = lastSyncAt;
    this.currentBlockHeight = currentBlockHeight;
    this.currentBlockHash = currentBlockHash;
    this.status = status;
  }

  /**
   * Get Last synced block height
   *
   * @returns {string}
   */
  getLastSyncedBlockHeight() {
    return this.lastSyncedBlockHeight;
  }

  /**
   * Get Last synced block hash
   *
   * @returns {string}
   */
  getLastSyncedBlockHash() {
    return this.lastSyncedBlockHash;
  }

  /**
   * Get Last sync date
   *
   * @returns {Date}
   */
  getLastSyncAt() {
    return this.lastSyncAt;
  }

  /**
   * Get Last blockchain height
   *
   * @returns {string}
   */
  getCurrentBlockHeight() {
    return this.currentBlockHeight;
  }

  /**
   * Get Last blockchain hash
   *
   * @returns {string}
   */
  getCurrentBlockHash() {
    return this.currentBlockHash;
  }

  /**
   * Get Drive sync status
   *
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Returns SyncInfo JSON representation
   *
   * @returns {{lastSyncedBlockHeight: string, lastSyncedBlockHash: string, lastSyncAt: Date,
   *                currentBlockHeight: string, currentBlockHash: string, status: string}}
   */
  toJSON() {
    return {
      lastSyncedBlockHeight: this.lastSyncedBlockHeight,
      lastSyncedBlockHash: this.lastSyncedBlockHash,
      lastSyncAt: this.lastSyncAt,
      currentBlockHeight: this.currentBlockHeight,
      currentBlockHash: this.currentBlockHash,
      status: this.status,
    };
  }
}

SyncInfo.STATUSES = {
  INITIAL_SYNC: 'initialSync',
  SYNCING: 'sync',
  SYNCED: 'synced',
};

module.exports = SyncInfo;
