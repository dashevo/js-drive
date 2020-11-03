const AbstractRootTreeLeaf = require('../rootTree/AbstractRootTreeLeaf');

class DataContractsStoreRootTreeLeaf extends AbstractRootTreeLeaf {
  /**
   * @param {MerkDbStore} dataContractsStore
   */
  constructor(dataContractsStore) {
    super(DataContractsStoreRootTreeLeaf.INDEX);

    this.dataContractsStore = dataContractsStore;
  }

  getHash() {
    return this.dataContractsStore.getRootHash();
  }
}

DataContractsStoreRootTreeLeaf.INDEX = 3;

module.exports = DataContractsStoreRootTreeLeaf;
