const MerkleTree = require('merkletreejs');
const hashFunction = require('./hashFunction');

class RootTree {
  /**
   *
   * @param {AbstractRootTreeLeaf[]} leaves
   */
  constructor(leaves) {
    leaves.forEach((leaf, index) => {
      if (leaf.getIndex() !== index) {
        throw new TypeError('Leaf index property and position in leaves array must be the same');
      }
    });

    this.leaves = leaves;

    this.rebuild();
  }

  /**
   * Get root hash
   *
   * @return {Buffer}
   */
  getRootHash() {
    this.tree.getRoot();
  }

  /**
   *
   * @param {AbstractRootTreeLeaf} leaf
   * @return {Array.<{left:number, right:number, data: Buffer}>}
   */
  getProof(leaf) {
    const hash = this.leafHashes[leaf.getIndex()];

    this.tree.getProof(hash);
  }

  /**
   * Rebuild root tree with updated leaf hashes
   */
  rebuild() {
    this.leafHashes = this.leaves.map((leaf) => leaf.getHash());
    this.tree = new MerkleTree(this.leafHashes, hashFunction);
  }
}

module.exports = RootTree;
