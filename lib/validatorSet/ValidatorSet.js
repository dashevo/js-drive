const {
  tendermint: {
    abci: {
      ValidatorUpdate,
    },
  },
} = require('@dashevo/abci/types');

const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const Hash = require('@dashevo/dashcore-lib/lib/crypto/hash');

class ValidatorsSet {
  /**
   * @param {SimplifiedMNList} sml
   */
  constructor(sml) {
    if (!sml) {
      throw new Error('ValidatorSet class requires sml as a parameter');
    }
    this.sml = sml;
  }

  /**
   * Fills up the validatorUpdates array
   *
   * @param {Object[]} validators
   * @returns {ValidatorUpdate[]}
   */
  static fillValidatorUpdates(validators) {
    let validatorUpdates = [];
    validators.forEach((member) => {
      const validatorUpdate = new ValidatorUpdate();
      validatorUpdate.proTxHash = member.proTxHash;
      if (member.pubKeyShare) {
        validatorUpdate.pubKey = member.pubKeyShare;
      }
      validatorUpdate.power = 100;
      validatorUpdates.push(validatorUpdate);
    });
    return validatorUpdates;
  }

  /**
   * Gets all validator quorums
   * @private
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  getValidatorQuorums() {
    return this.sml.getQuorumsOfType(this.sml.getValidatorLLMQType());
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
    scoredHashes.sort((a, b) => Buffer.compare(a.score, b.score));
    return scoredHashes[0].hash;
  }

  /**
   * Gets the current validator set for a particular core height
   * @param {Buffer} rotationEntropy - the entropy to select the quorum
   * @param {number} coreBlockHeight - block height of the core chain
   * @return {string} - the current validator set's quorumHash
   */
  async getHashForCoreHeight(rotationEntropy, coreBlockHeight) {
    const validatorQuorumHashes = this.getValidatorQuorums().map((quorum) => Buffer.from(quorum.quorumHash, 'hex'));
    return this.selectValidatorSetHash(validatorQuorumHashes, rotationEntropy).toString('hex');
  }
}

module.exports = ValidatorsSet;
