const sinon = require('sinon');
const {
  tendermint: {
    abci: {
      ValidatorUpdate,
    },
  },
} = require('@dashevo/abci/types');

const ValidatorSet = require('../../../lib/validatorSet/ValidatorSet');
const getSmlFixture = require('../../../lib/test/fixtures/getSmlFixture');

describe('ValidatorSet', () => {
  let smlMock;
  let quorumInfoFixture;
  let quorumInfoMemberFixture;
  let rotationEntropy;
  let rotationEntropyBuffer;

  beforeEach(() => {
    if (!this.sinon) {
      this.sinon = sinon.createSandbox();
    } else {
      this.sinon.restore();
    }

    smlMock = {
      getValidatorLLMQType: this.sinon.stub().returns(1),
      getQuorumsOfType: this.sinon.stub().returns(
        getSmlFixture()[0].newQuorums.filter((quorum) => quorum.llmqType === 1),
      ),
    };

    rotationEntropy = '00000ac05a06682172d8b49be7c9ddc4189126d7200ebf0fc074c433ae74b596';

    rotationEntropyBuffer = Buffer.from(rotationEntropy, 'hex');

    quorumInfoFixture = [
      {
        proTxHash: 'c286807d463b06c7aba3b9a60acf64c1fc03da8c1422005cd9b4293f08cf0562',
        pubKeyOperator: '06abc1c890c9da4e513d52f20da1882228bfa2db4bb29cbd064e1b2a61d9dcdadcf0784fd1371338c8ad1bf323d87ae6',
        valid: true,
      },
      {
        proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f',
        pubKeyOperator: '04d748ba0efeb7a8f8548e0c22b4c188c293a19837a1c5440649279ba73ead0c62ac1e840050a10a35e0ae05659d2a8d',
        valid: true,
      },
    ];
    quorumInfoMemberFixture = [
      {
        proTxHash: 'c286807d463b06c7aba3b9a60acf64c1fc03da8c1422005cd9b4293f08cf0562',
        pubKeyOperator: '06abc1c890c9da4e513d52f20da1882228bfa2db4bb29cbd064e1b2a61d9dcdadcf0784fd1371338c8ad1bf323d87ae6',
        valid: true,
        pubKeyShare: '00d7bb8d6753865c367824691610dcc313b661b7e024e36e82f8af33f5701caddb2668dadd1e647d8d7d5b30e37ebbcf',
      },
      {
        proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f',
        pubKeyOperator: '04d748ba0efeb7a8f8548e0c22b4c188c293a19837a1c5440649279ba73ead0c62ac1e840050a10a35e0ae05659d2a8d',
        valid: true,
        pubKeyShare: '86d0992f5c73b8f57101c34a0c4ebb17d962bb935a738c1ef1e2bb1c25034d8e4a0a2cc96e0ebc69a7bf3b8b67b2de5f',
      },
    ];
  });

  afterEach(function afterEach() {
    this.sinon.restore();
  });

  it('constructor', () => {
    const validatorSet = new ValidatorSet(smlMock);
    expect(validatorSet.sml).to.be.equal(smlMock);
    expect(validatorSet).to.be.an.instanceOf(ValidatorSet);
  });
  it('getHash', async () => {
    const validatorSet = new ValidatorSet(smlMock);
    const validatorSetHash = await validatorSet.getHash(rotationEntropyBuffer);
    expect(validatorSetHash).to.be.a('string');
    expect(validatorSetHash).to.be.equal('0000008d3d35c02fab8cc631d85d968c1e09cff14c78d517821851956805b7ad');
  });
  it('should fill validator updates', () => {
    const validatorUpdates = ValidatorSet.fillValidatorUpdates(quorumInfoFixture);
    expect(validatorUpdates).to.be.an('array');
    expect(validatorUpdates).to.not.have.property('pubKey');
    expect(validatorUpdates[0]).to.be.an.instanceOf(ValidatorUpdate);
  });
  it('should fill validator updates if this node is a validator quorum member', () => {
    const validatorUpdates = ValidatorSet.fillValidatorUpdates(quorumInfoMemberFixture);
    expect(validatorUpdates).to.be.an('array');
    expect(validatorUpdates[0]).to.have.property('pubKey');
    expect(validatorUpdates[0]).to.be.an.instanceOf(ValidatorUpdate);
  });
});
