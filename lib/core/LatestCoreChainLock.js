const EventEmitter = require('events');

class LatestCoreChainLock extends EventEmitter {
  /**
   *
   * @param {ChainLock} [chainLock]
   */
  constructor(chainLock) {
    super();

    this.chainLock = chainLock;
  }

  /**
   * Update latest chainlock
   *
   * @param {ChainLock} chainLock
   * @return {LatestCoreChainLock}
   */
  update(chainLock) {
    this.chainLock = chainLock;

    this.emit(LatestCoreChainLock.TOPICS.update, this.chainLock);

    return this;
  }
}

LatestCoreChainLock.TOPICS = {
  update: 'update',
};

module.exports = LatestCoreChainLock;
