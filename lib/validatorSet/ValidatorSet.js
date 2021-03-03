const {
  tendermint: {
    abci: {
      ValidatorUpdate,
    },
    crypto: {
      PublicKey,
    },
  },
} = require('@dashevo/abci/types');

const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const Hash = require('@dashevo/dashcore-lib/lib/crypto/hash');

const DEFAULT_DASH_VOTING_POWER = 100;
const PUBKEY_NULL_FILLED = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

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
    const validatorUpdates = [];
    validators.forEach((member) => {
      if (member.valid) {
        const pubKeyShare = member.pubKeyShare ? member.pubKeyShare : PUBKEY_NULL_FILLED;
        const validatorUpdate = new ValidatorUpdate({
          pubKey: new PublicKey({
            bls12381: Uint8Array.from(Buffer.from(pubKeyShare, 'hex')),
          }),
          power: DEFAULT_DASH_VOTING_POWER,
          proTxHash: Buffer.from(member.proTxHash, 'hex'),
        });
        validatorUpdates.push(validatorUpdate);
      }
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
   * @return {string} - the current validator set's quorumHash
   */
  async getHash(rotationEntropy) {
    const validatorQuorumHashes = this.getValidatorQuorums().map((quorum) => Buffer.from(quorum.quorumHash, 'hex'));
    return this.selectValidatorSetHash(validatorQuorumHashes, rotationEntropy).toString('hex');
  }
}

module.exports = ValidatorsSet;
