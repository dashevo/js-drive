const AbstractRootTreeLeaf = require('../rootTree/AbstractRootTreeLeaf');

class IdentitiesStoreRootTreeLeaf extends AbstractRootTreeLeaf {
  /**
   * @param {MerkDbStore} identitiesStore
   */
  constructor(identitiesStore) {
    super(1);

    this.identitiesStore = identitiesStore;
  }

  getHash() {
    return this.identitiesStore.getRootHash();
  }
}

module.exports = IdentitiesStoreRootTreeLeaf;
