const { MerkleTree } = require('merkletreejs');
const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');

const hashFunction = require('./hashFunction');
const convertRootTreeProofToBuffer = require('./convertRootTreeProofToBuffer');

const InvalidLeafIndexError = require('./errors/InvalidLeafIndexError');

class RootTree {
  /**
   *
   * @param {AbstractRootTreeLeaf[]} leaves
   */
  constructor(leaves) {
    leaves.forEach((leaf, index) => {
      if (leaf.getIndex() !== index) {
        throw new InvalidLeafIndexError(leaf, index);
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
    return this.tree.getRoot();
  }

  /**
   *
   * @param {AbstractRootTreeLeaf} leaf
   * @return {Array.<{left:number, right:number, data: Buffer}>}
   */
  getProof(leaf) {
    const hash = this.leafHashes[leaf.getIndex()];

    return this.tree.getProof(hash);
  }

  /**
   *
   * @param {AbstractRootTreeLeaf} leaf
   * @param {Array<Buffer>} leafKeys
   * @return {Buffer}
   */
  getFullProof(leaf, leafKeys) {
    const leafProofBuffer = leaf.getProof(leafKeys);
    const rootTreeProofBuffer = convertRootTreeProofToBuffer(this.getProof(leaf));

    const fullProof = new BufferWriter();
    fullProof.writeVarintNum(rootTreeProofBuffer.length);
    fullProof.write(rootTreeProofBuffer);
    fullProof.writeVarintNum(leafProofBuffer.length);
    fullProof.write(leafProofBuffer);

    return fullProof.toBuffer();
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
