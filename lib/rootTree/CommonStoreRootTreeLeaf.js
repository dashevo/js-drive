const AbstractRootTreeLeaf = require('./AbstractRootTreeLeaf');

class CommonStoreRootTreeLeaf extends AbstractRootTreeLeaf {
  /**
   * @param {MerkDbStore} commonStore
   */
  constructor(commonStore) {
    super(0);

    this.commonStore = commonStore;
  }

  getHash() {
    return this.commonStore.getRootHash();
  }
}

module.exports = CommonStoreRootTreeLeaf;
