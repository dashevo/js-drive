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
const NotFoundAbciError = require('../abci/errors/NotFoundAbciError');
const InternalAbciError = require('../abci/errors/InternalAbciError');

const DEFAULT_DASH_VOTING_POWER = 100;
const PUBKEY_NULL_FILLED = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const ROTATION_BLOCK_INTERVAL = 15;

class ValidatorQuorums {
  /**
   * @param {SimplifiedMasternodeList} simplifiedMasternodeList
   * @param {RpcClient} coreRpcClient
   */
  constructor(simplifiedMasternodeList,
    coreRpcClient) {
    this.simplifiedMasternodeList = simplifiedMasternodeList;
    this.coreRpcClient = coreRpcClient;
    this.validatorQuorumHash = '';
    this.sml = null;
  }

  /**
   * Rotates to a new active validator set from among all active validator quorums
   * @param {number} height
   * @param {number} coreHeight
   * @param {Uint8Array} rotationEntropy
   */
  async rotate(height, coreHeight, rotationEntropy) {
    // validator set is rotated every ROTATION_BLOCK_INTERVAL blocks
    if (height % ROTATION_BLOCK_INTERVAL === 0) {
      this.sml = this.simplifiedMasternodeList.getStore().getSMLbyHeight(coreHeight);
      this.validatorQuorumHash = await this.getHash(
        Buffer.from(rotationEntropy),
      );
      return true;
    }
    return false;
  }

  /**
   * Chooses an active validator set from among all active validator quorums for the first time
   * @param {number} coreHeight
   */
  async init(coreHeight) {
    this.sml = this.simplifiedMasternodeList.getStore().getSMLbyHeight(coreHeight);
    // using the block hash at the first core height as entropy
    this.validatorQuorumHash = await this.getHash(
      Buffer.from(this.sml.toSimplifiedMNListDiff().blockHash),
    );
    return true;
  }

  async toABCIValidatorUpdates() {
    if (this.sml === null) {
      throw new InternalAbciError('SML is not initialized. Please call ValidatorQuorums.init() first');
    }
    try {
      const {
        result: {
          members: validators,
        },
      } = await this.coreRpcClient.quorum('info', `${this.sml.getValidatorLLMQType()}`, `${this.validatorQuorumHash}`);
      return this.fillValidatorUpdates(validators);
    } catch (e) {
      if (e.code === -8) {
        throw new NotFoundAbciError(`The quorum of type ${this.sml.getValidatorLLMQType()} and quorumHash ${this.validatorQuorumHash} doesn't exist`);
      } else {
        throw new NotFoundAbciError('No validator info found');
      }
    }
  }

  /**
   * Gets all validator quorums
   * @private
   * @return {QuorumEntry[]} - array of all active validator quorums
   */
  getValidatorQuorums() {
    if (this.sml === null) {
      throw new InternalAbciError('SML is not initialized. Please call ValidatorQuorums.init() first');
    }
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
   * @private
   * Gets the current validator set quorum hash for a particular core height
   * @param {Buffer} rotationEntropy - the entropy to select the quorum
   * @return {string} - the current validator set's quorumHash
   */
  async getHash(rotationEntropy) {
    const validatorQuorumHashes = this.getValidatorQuorums().map((quorum) => Buffer.from(quorum.quorumHash, 'hex'));
    return this.selectValidatorSetHash(validatorQuorumHashes, rotationEntropy).toString('hex');
  }

  /**
   * Gets the current validator set quorum
   * @return {QuorumEntry} - the current validator set
   */
  getValidatorSet() {
    if (this.sml === null) {
      throw new InternalAbciError('SML is not initialized. Please call ValidatorQuorums.init() first');
    }
    return this.sml.getQuorum(this.sml.getValidatorLLMQType(), this.validatorQuorumHash);
  }

  /**
   * Fills up the validatorUpdates array
   * @private
   * @param {Object[]} validators
   * @returns {ValidatorUpdate[]}
   */
  fillValidatorUpdates(validators) {
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
}

module.exports = ValidatorQuorums;
