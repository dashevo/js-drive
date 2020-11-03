const AbstractRootTreeLeaf = require('../rootTree/AbstractRootTreeLeaf');

class DataContractsStoreRootTreeLeaf extends AbstractRootTreeLeaf {
  /**
   * @param {MerkDbStore} dataContractsStore
   */
  constructor(dataContractsStore) {
    super(2);

    this.dataContractsStore = dataContractsStore;
  }

  getHash() {
    return this.dataContractsStore.getRootHash();
  }
}

module.exports = DataContractsStoreRootTreeLeaf;
