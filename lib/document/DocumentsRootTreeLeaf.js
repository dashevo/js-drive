const AbstractRootTreeLeaf = require('../rootTree/AbstractRootTreeLeaf');

class DocumentsRootTreeLeaf extends AbstractRootTreeLeaf {
  /**
   * @param {MerkDbStore} documentsStore
   */
  constructor(documentsStore) {
    super(DocumentsRootTreeLeaf.INDEX);

    this.documentsStore = documentsStore;
  }

  getHash() {
    return this.documentsStore.getRootHash();
  }
}

DocumentsRootTreeLeaf.INDEX = 4;

module.exports = DocumentsRootTreeLeaf;
