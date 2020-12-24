const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const Hash = require('@dashevo/dashcore-lib/lib/crypto/hash');

class ValidatorsSet {
  /**
   * @param {SimplifiedMNListStore} smlStore
   */
  constructor(smlStore) {
    if (!smlStore) {
      throw new Error('ValidatorSet class requires smlStore as a parameter');
    }
    this.smlStore = smlStore;
  }

  /**
   * Gets all validator quorums.
   * @private
   * @param {SimplifiedMNList} sml - a simplified masternode list\
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  static getValidatorQuorums(sml) {
    return sml.getQuorumsOfType(sml.getValidatorLLMQType());
  }

  /**
   * Calculates scores for validator quorum selection
   * @private
   * it calculates sha256(hash, modifier) per quorumHash
   * Please note that this is not a double-sha256 but a single-sha256
   * @param {Buffer[]} quorumHashes
   * @param {Buffer} modifier
   * @return {Object[]} scores
   */
  calculateScores(quorumHashes, modifier) {
    return quorumHashes.map((hash) => {
      const bufferWriter = new BufferWriter();
      bufferWriter.write(hash);
      bufferWriter.write(modifier);
      return { score: Hash.sha256(bufferWriter.toBuffer()), hash };
    });
  }

  /**
   * Selects one validator quorums' hash from all validator quorums' quorumHashes
   * @private
   * @param {Buffer[]} quorumHashes - an array of validator quorums' quorumHashes
   * @param {Buffer} rotationEntropy - the entropy to select the quorum
   * @return {Buffer} - the current validator set's quorumHash
   */
  selectValidatorSetHash(quorumHashes, rotationEntropy) {
    const scoredHashes = this.calculateScores(quorumHashes, rotationEntropy);
    return scoredHashes.sort((a, b) => Buffer.compare(a.score, b.score))[0].hash;
  }

  /**
   * Gets the current validator set for a particular core height
   * @param {Buffer} rotationEntropy - the entropy to select the quorum
   * @param {number} coreBlockHeight
   * @return {string} - the current validator set's quorumHash
   */
  async getHashForCoreHeight(rotationEntropy, coreBlockHeight) {
    const sml = this.smlStore.getSMLbyHeight(coreBlockHeight);
    const validatorQuorumHashes = ValidatorsSet.getValidatorQuorums(sml).map((quorum) => Buffer.from(quorum.quorumHash, 'hex'));
    return this.selectValidatorSetHash(validatorQuorumHashes, rotationEntropy).toString('hex').reverse();
  }
}

module.exports = ValidatorsSet;
