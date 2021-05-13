const Validator = require('./Validator');

class ValidatorSet {
  /**
   * @param {SimplifiedMasternodeList} simplifiedMasternodeList
   * @param {getRandomQuorum} getRandomQuorum
   * @param {fetchQuorumMembers} fetchQuorumMembers
   */
  constructor(simplifiedMasternodeList, getRandomQuorum, fetchQuorumMembers) {
    this.simplifiedMasternodeList = simplifiedMasternodeList;
    this.getRandomQuorum = getRandomQuorum;
    this.fetchQuorumMembers = fetchQuorumMembers;

    this.sml = null;
    this.quorum = null;
    this.validators = [];
  }

  /**
   * Chooses an active validator set from among all active validator quorums for the first time
   *
   * @param {number} coreHeight
   */
  async initialize(coreHeight) {
    // using the block hash at the first core height as entropy
    const rotationEntropy = Buffer.from(this.sml.toSimplifiedMNListDiff().blockHash);

    await this.switchToRandomQuorum(
      coreHeight,
      rotationEntropy,
    );
  }

  /**
   * Rotates to a new active validator set from among all active validator quorums
   *
   * @param {Long} height
   * @param {number} coreHeight
   * @param {Buffer} rotationEntropy
   */
  async rotate(height, coreHeight, rotationEntropy) {
    // validator set is rotated every ROTATION_BLOCK_INTERVAL blocks
    if (height.toNumber() % ValidatorSet.ROTATION_BLOCK_INTERVAL !== 0) {
      return false;
    }

    await this.switchToRandomQuorum(
      coreHeight,
      rotationEntropy,
    );

    return true;
  }

  /**
   * Get Validator Set Quorum
   *
   * @return {QuorumEntry}
   */
  getQuorum() {
    if (!this.sml) {
      throw new Error('Validator Set is not initialized');
    }

    return this.quorum;
  }

  /**
   * Get validators
   *
   * @return {Validator[]}
   */
  getValidators() {
    if (!this.sml) {
      throw new Error('Validator Set is not initialized');
    }

    return this.validators;
  }

  /**
   * @private
   * @param {number} coreHeight
   * @param {Buffer} rotationEntropy
   * @return {Promise<void>}
   */
  async switchToRandomQuorum(coreHeight, rotationEntropy) {
    this.sml = this.simplifiedMasternodeList.getStore().getSMLbyHeight(coreHeight);

    this.quorum = await this.getRandomQuorum(
      this.sml,
      this.sml.getValidatorLLMQType(),
      rotationEntropy,
    );

    const quorumMembers = await this.fetchQuorumMembers(
      this.sml.getValidatorLLMQType(),
      this.quorum.quorumHash,
    );

    this.validators = quorumMembers
      .filter((member) => member.valid)
      .map((member) => Validator.createFromQuorumMember(member));
  }
}

ValidatorSet.ROTATION_BLOCK_INTERVAL = 15;

module.exports = ValidatorSet;
