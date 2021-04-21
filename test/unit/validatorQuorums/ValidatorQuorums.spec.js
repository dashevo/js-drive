const sinon = require('sinon');
const {
  tendermint: {
    abci: {
      ValidatorUpdate,
    },
  },
} = require('@dashevo/abci/types');

const QuorumEntry = require('@dashevo/dashcore-lib/lib/deterministicmnlist/QuorumEntry');
const NotFoundAbciError = require('../../../lib/abci/errors/NotFoundAbciError');
const ValidatorQuorums = require('../../../lib/validatorQuorums/ValidatorQuorums');
const getSmlFixture = require('../../../lib/test/fixtures/getSmlFixture');

describe('ValidatorQuorums', () => {
  let smlStoreMock;
  let simplifiedMasternodeListMock;
  let smlMock;
  let validatorsFixture;
  let validatorsNonMemberFixture;
  let coreRpcClientMock;
  let coreRpcClientMockNonMember;
  let coreRpcClientMockQuorumDoesntExistError;
  let coreRpcClientMockUnkownError;
  let rotationEntropy;
  let rotationEntropyBuffer;
  let noSuchQuorumError;
  let unknownError;
  let validatorQuorumEntry;

  beforeEach(() => {
    if (!this.sinon) {
      this.sinon = sinon.createSandbox();
    } else {
      this.sinon.restore();
    }

    validatorQuorumEntry = new QuorumEntry(getSmlFixture()[0].newQuorums[0]);

    smlMock = {
      getQuorum: this.sinon.stub().returns(validatorQuorumEntry),
      getValidatorLLMQType: this.sinon.stub().returns(1),
      getQuorumsOfType: this.sinon.stub().returns(
        getSmlFixture()[0].newQuorums.filter((quorum) => quorum.llmqType === 1),
      ),
    };

    smlStoreMock = {
      getSMLbyHeight: this.sinon.stub().returns(smlMock),
      getCurrentSML: this.sinon.stub().returns(smlMock),
    };

    simplifiedMasternodeListMock = {
      getStore: this.sinon.stub().returns(smlStoreMock),
    };

    noSuchQuorumError = new Error({ code: -8 });
    coreRpcClientMockQuorumDoesntExistError = {
      quorum: this.sinon.stub().throws(noSuchQuorumError),
    };

    unknownError = new Error({ code: -928374 });
    coreRpcClientMockUnkownError = {
      quorum: this.sinon.stub().throws(unknownError),
    };

    rotationEntropy = '00000ac05a06682172d8b49be7c9ddc4189126d7200ebf0fc074c433ae74b596';

    rotationEntropyBuffer = Buffer.from(rotationEntropy, 'hex');

    validatorsFixture = [
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
      {
        proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f',
        pubKeyOperator: '04d748ba0efeb7a8f8548e0c22b4c188c293a19837a1c5440649279ba73ead0c62ac1e840050a10a35e0ae05659d2a8d',
        valid: false,
      },
    ];

    validatorsNonMemberFixture = [
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

    coreRpcClientMock = {
      quorum: this.sinon.stub().resolves({
        result: {
          members: validatorsFixture,
        },
        error: null,
        id: 5,
      }),
    };

    coreRpcClientMockNonMember = {
      quorum: this.sinon.stub().resolves({
        result: {
          members: validatorsNonMemberFixture,
        },
        error: null,
        id: 5,
      }),
    };
  });

  afterEach(function afterEach() {
    this.sinon.restore();
  });

  it('constructor', () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    expect(validatorQuorums.sml).to.be.equal(smlMock);
    expect(validatorQuorums.coreRpcClient).to.be.equal(coreRpcClientMock);
    expect(validatorQuorums).to.be.an.instanceOf(ValidatorQuorums);
  });
  it('should rotate if height divisible by ROTATION_BLOCK_INTERVAL', async () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    const isRotated = await validatorQuorums.rotate(15, 'anyEntropyWillDo');
    expect(isRotated).to.be.equal(true);
    expect(validatorQuorums.validatorQuorumHash).to.be.equal('0000055cc3271edb256ae4f8bf1837b7accef516aca3e450546fb0598efef7e2');
  });
  it('should not rotate if height not divisible by ROTATION_BLOCK_INTERVAL', async () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    const isRotated = await validatorQuorums.rotate(1, 'anyEntropyWillDo');
    expect(isRotated).to.be.equal(false);
    expect(validatorQuorums.validatorQuorumHash).to.be.equal('');
  });
  it('getHash', async () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    const validatorSetHash = await validatorQuorums.getHash(rotationEntropyBuffer);
    expect(validatorSetHash).to.be.a('string');
    expect(validatorSetHash).to.be.equal('0000008d3d35c02fab8cc631d85d968c1e09cff14c78d517821851956805b7ad');
  });
  it('should get the current validator set', () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    const validatorSet = validatorQuorums.getValidatorSet();
    expect(validatorSet).to.be.an.instanceOf(QuorumEntry);
  });
  it('should get the abci validator update if node is a member of one of the active validator quorums', async () => {
    const validatorQuorums = new ValidatorQuorums(simplifiedMasternodeListMock, coreRpcClientMock);
    const validatorUpdates = await validatorQuorums.toABCIValidatorUpdates();
    expect(validatorUpdates).to.be.an('array');
    expect(validatorUpdates.length).to.be.equal(2);
    expect(validatorUpdates[0]).to.have.property('pubKey');
    expect(validatorUpdates[0]).to.be.an.instanceOf(ValidatorUpdate);
  });
  it('should get the abci validator update with null filled puKey if node is NOT a member of one of the active validator quorums', async () => {
    const validatorQuorums = new ValidatorQuorums(
      simplifiedMasternodeListMock, coreRpcClientMockNonMember,
    );
    const validatorUpdates = await validatorQuorums.toABCIValidatorUpdates();
    const pubKeyNullFilledString = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const pubKeyNullFilled = Uint8Array.from(Buffer.from(pubKeyNullFilledString, 'hex'));
    expect(validatorUpdates).to.be.an('array');
    expect(validatorUpdates[0]).to.have.property('pubKey');
    expect(validatorUpdates[0].pubKey.bls12381).to.be.deep.equal(pubKeyNullFilled);
    expect(validatorUpdates[0]).to.be.an.instanceOf(ValidatorUpdate);
  });
  it('toABCIValidatorUpdates should throw a NotFoundAbciError error when rpc returns no such quorum found error', async () => {
    const validatorQuorums = new ValidatorQuorums(
      simplifiedMasternodeListMock, coreRpcClientMockQuorumDoesntExistError,
    );
    try {
      await validatorQuorums.toABCIValidatorUpdates();
    } catch (e) {
      expect(e).to.be.an.instanceOf(NotFoundAbciError);
    }
  });
  it('toABCIValidatorUpdates should throw a NotFoundAbciError error when rpc returns unknown error', async () => {
    const validatorQuorums = new ValidatorQuorums(
      simplifiedMasternodeListMock, coreRpcClientMockUnkownError,
    );
    try {
      await validatorQuorums.toABCIValidatorUpdates();
    } catch (e) {
      expect(e).to.be.an.instanceOf(NotFoundAbciError);
    }
  });
});
