const LatestCoreChainLock = require('../../../lib/core/LatestCoreChainLock');

describe('LatestCoreChainLock', () => {
  beforeEach(() => {
  });

  describe('instantiation', () => {
    it('should instantiates', () => {
      const latestCoreChainLock = new LatestCoreChainLock();
      expect(latestCoreChainLock.chainLock).to.equal(null);
      const latestCoreChainLockWithValue = new LatestCoreChainLock('someValue');
      expect(latestCoreChainLockWithValue.chainLock).to.equal('someValue');
    });
  });
  describe('usage', () => {
    it('should update', () => {
      const latestCoreChainLock = new LatestCoreChainLock();
      latestCoreChainLock.update('someValue');
      expect(latestCoreChainLock.chainLock).to.equal('someValue');
    });
  });
});
