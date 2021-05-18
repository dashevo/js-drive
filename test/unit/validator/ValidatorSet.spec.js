const ValidatorSet = require('../../../lib/validator/ValidatorSet');

describe('ValidatorSet', () => {
  let validatorSet;
  let simplifiedMasternodeListMock;
  let getRandomQuorumMock;
  let fetchQuorumMembersMock;

  beforeEach(function beforeEach() {
    simplifiedMasternodeListMock = this.sinon.stub();
    getRandomQuorumMock = this.sinon.stub();
    fetchQuorumMembersMock = this.sinon.stub();

    validatorSet = new ValidatorSet(
      simplifiedMasternodeListMock,
      getRandomQuorumMock,
      fetchQuorumMembersMock,
    );
  });

  describe('initialize', () => {
    it('should initialize with specified core height', async () => {
      await validatorSet.initialize(42);
    });
  });

  describe('rotate', () => {
    it('should rotate validator set with specified core height and entropy if height divisible by ROTATION_BLOCK_INTERVAL', () => {
      throw new Error('implement');
    });

    it('should not rotate validator set if height not divisible by ROTATION_BLOCK_INTERVAL', () => {
      throw new Error('implement');
    });
  });

  describe('getQuorum', () => {
    it('should return QuorumEntry', () => {
      throw new Error('implement');
    });

    it('should thrown an error if ValidatorSet is not initialized', () => {
      throw new Error('implement');
    });
  });

  describe('getValidators', () => {
    it('should return array of validators', () => {
      throw new Error('implement');
    });

    it('should thrown an error if ValidatorSet is not initialized', () => {
      throw new Error('implement');
    });
  });
});
