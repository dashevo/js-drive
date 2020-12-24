const {
  tendermint: {
    abci: {
      ResponseEndBlock,
      // ValidatorSetUpdate, TODO: test once available in new version of js-abci
    },
    crypto: {
      PublicKey,
    },
    types: {
      CoreChainLock,
    },
  },
} = require('@dashevo/abci/types');

const generateRandomIdentifier = require('@dashevo/dpp/lib/test/utils/generateRandomIdentifier');

const endBlockHandlerFactory = require('../../../../lib/abci/handlers/endBlockHandlerFactory');

const getValidatorSetInfoFactory = require('../../../../lib/core/getValidatorSetInfoFactory');

const BlockExecutionContextMock = require('../../../../lib/test/mock/BlockExecutionContextMock');

const NoDPNSContractFoundError = require('../../../../lib/abci/handlers/errors/NoDPNSContractFoundError');
const NoDashpayContractFoundError = require('../../../../lib/abci/handlers/errors/NoDashpayContractFoundError');

describe('endBlockHandlerFactory', () => {
  let endBlockHandler;
  let requestMock;
  let headerMock;
  let blockExecutionContextMock;
  let dpnsContractId;
  let dpnsContractBlockHeight;
  let dashpayContractId;
  let dashpayContractBlockHeight;
  let latestCoreChainLockMock;
  let simplifiedMasternodeListMock;
  let smlStoreMock;
  let smlMock;
  let getValidatorSetInfo;
  let loggerMock;
  let chainLockMock;
  let validatorsFixture;
  let validatorsUpdateFixture;
  let coreRpcClientMock;
  let quorumListFixture;

  beforeEach(function beforeEach() {
    headerMock = {
      coreChainLockedHeight: 2,
      lastCommitHash: Uint8Array.from('c5ac594a4d00199db59c178104effff54bcd082d9be4e7625196817719730426'),
    };

    blockExecutionContextMock = new BlockExecutionContextMock(this.sinon);

    blockExecutionContextMock.hasDataContract.returns(true);
    blockExecutionContextMock.getHeader.returns(headerMock);

    chainLockMock = {
      height: 1,
      blockHash: Buffer.alloc(0),
      signature: Buffer.alloc(0),
    };

    latestCoreChainLockMock = {
      getChainLock: this.sinon.stub().returns(chainLockMock),
    };

    quorumListFixture = [
      {
        "version": 1,
        "llmqType": 4,
        "quorumHash": "000003c9f4d1d56c1805832efcffea8d3338f79457138d953d82e48f4015a220",
        "signersCount": 50,
        "signers": "ffffffffffff03",
        "validMembersCount": 50,
        "validMembers": "ffffffffffff03",
        "quorumPublicKey": "92c9283ec9ff66571278e9c59bc121a60b0cf48fb28f7b8812c95b8c9d88ff3acef031ca43e5704e276b0b2e497e6535",
        "quorumVvecHash": "d31fa3b0741389753fac3bcc5b301e8ade6f4378f6592c8ed743ec265a6a5b91",
        "quorumSig": "014bd484e67037e4456eb7798767ca74cf11768852c34a6dbeb5669e04d3b8a5058e10da87a12d3a69e7922edf2ab88617c9dc7ffede9ca78ac08d4e04be5aedfadd02a8cdcf4d74b4b8b856ccf6a74fb80995652182e0b405fca39099ed4ac0",
        "membersSig": "0b48b48a99b12d4f2c868dcd322d9f10064c513733b8b784c80a2995d9e1536fb48933100d17ffd066b7fb241fb35ae00f949b2b46eacc3b9b79c38e115e69a876bdc185ea79a7ab08f5440ad44d27b6bf60aaa15161fc805ddb49f14861d0d0"
      },
      {
        "version": 1,
        "llmqType": 1,
        "quorumHash": "000002df62636a47af1046c0f5ece8e1d5fde9b18d572059fe00621668727a26",
        "signersCount": 50,
        "signers": "ffffffffffff03",
        "validMembersCount": 50,
        "validMembers": "ffffffffffff03",
        "quorumPublicKey": "80de8564cacea4ce889a897a8075fc3783cf5157e0badc7e73a2811343f9a24ec9068ccabc9568339ba8526586427dad",
        "quorumVvecHash": "9bd9d7f7bd24474df5ade8cacc0688f759102fe366bff6605b2b079746ff4521",
        "quorumSig": "0c5902d8f342b6e72ad5c5c37032cccf998567d7c101e9a2c526bdb108f2bebfac7eb2babea7995884164b5bfbf83e1d11ba8678fefb8d1bea670d68bcb00f55234f135d0602926a7b2f27f97930370ea5c6b2d3f4dd72ebbd99b00a59bce0cf",
        "membersSig": "1972b1ea85ab624400b7accfbf04f2efc47dafd1db14ff6cbbb67a2ab754d885703c6668f70cbaf69c60a413aa606d2e1023a2a9534f827795c013eddfdad6a289902d6aee0890f4fcc7058a45478a363e6f582db842362efb5e5d0c3c76e6eb"
      },
      {
        "version": 1,
        "llmqType": 1,
        "quorumHash": "000006e75a0f3551e79dc306eb6f47aae80e408e23b006e62e82a9c6a6f7c32b",
        "signersCount": 50,
        "signers": "ffffffffffff03",
        "validMembersCount": 50,
        "validMembers": "ffffffffffff03",
        "quorumPublicKey": "11a3455ecf0577b213a056aa0d313a0081eca46f0bebac5fe991fd09d04b211f71ee337f10257a4f31b8047ac58b556f",
        "quorumVvecHash": "7a5d7069006cec12587033dce9744a289b3924d538d529d492181050693d3b34",
        "quorumSig": "92cc8cec5af871bfe208e464ecac26d64db5843c3511d66be541e485854faf3e83814b9eef32c84b779e17ca6d2af34f161f90cd5e8e070ac975dca8b84b189a14b54510e0cd8c6f75cb7175541d050a2069602155aa65e063b64aef9824615b",
        "membersSig": "892e85b71523e3547dbe4b4ac33b960d455e19f4bca3d37f5c39c8b581cf6e0385a94f3de4bef410ef828b7e2518cd550eec1de0ca131e4f07afee176ea877263373212e5f70dabe2fa129707cd96eef0c32f1bad41a9a6c83a6ca6a3d1808c2"
      }
  ];

    smlMock = {
      getValidatorLLMQType: this.sinon.stub().returns(4),
      getQuorums: this.sinon.stub().returns(quorumListFixture),
      getVerifiedQuorums: this.sinon.stub().returns(quorumListFixture),
    };

    smlStoreMock = {
      getSMLbyHeight: this.sinon.stub().returns(smlMock),
      getCurrentSML: this.sinon.stub().returns(smlMock),
    };

    simplifiedMasternodeListMock = {
      getStore: this.sinon.stub().returns(smlStoreMock),
    };

    validatorsFixture = [
      { proTxHash: 'c286807d463b06c7aba3b9a60acf64c1fc03da8c1422005cd9b4293f08cf0562',
        pubKeyOperator: '06abc1c890c9da4e513d52f20da1882228bfa2db4bb29cbd064e1b2a61d9dcdadcf0784fd1371338c8ad1bf323d87ae6',
        valid: true },
      { proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f',
        pubKeyOperator: '04d748ba0efeb7a8f8548e0c22b4c188c293a19837a1c5440649279ba73ead0c62ac1e840050a10a35e0ae05659d2a8d',
        valid: true },
    ];

    validatorsUpdateFixture = [
      { proTxHash: 'c286807d463b06c7aba3b9a60acf64c1fc03da8c1422005cd9b4293f08cf0562', power: 100 },
      { proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f', power: 100 },
    ];

    coreRpcClientMock = {
      quorum: this.sinon.stub().resolves({
        result: {
          members: validatorsFixture,
        },
        error: null,
        id: 5,
      })
    };

    getValidatorSetInfo = getValidatorSetInfoFactory(coreRpcClientMock);

    loggerMock = {
      debug: this.sinon.stub(),
      info: this.sinon.stub(),
      trace: this.sinon.stub(),
    };

    dpnsContractId = generateRandomIdentifier();
    dpnsContractBlockHeight = 2;

    dashpayContractId = generateRandomIdentifier();
    dashpayContractBlockHeight = 2;

    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      dashpayContractBlockHeight,
      dashpayContractId,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    requestMock = {
      height: dpnsContractBlockHeight,
    };
  });

  it('should simply return a response if DPNS contract was not set', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      undefined,
      undefined,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    const response = await endBlockHandler(requestMock);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);
    expect(response.toJSON()).to.be.empty();

    expect(blockExecutionContextMock.hasDataContract).to.not.have.been.called();
  });

  it('should return a response if DPNS contract is present at specified height', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      undefined,
      undefined,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    const response = await endBlockHandler(requestMock);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(response.toJSON()).to.be.empty();

    expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
      dpnsContractId,
    );
  });

  it('should throw and error if DPNS contract is not present at specified height', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      undefined,
      undefined,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    blockExecutionContextMock.hasDataContract.returns(false);

    try {
      await endBlockHandler(requestMock);

      expect.fail('Error was not thrown');
    } catch (e) {
      expect(e).to.be.an.instanceOf(NoDPNSContractFoundError);
      expect(e.getContractId()).to.equal(dpnsContractId);
      expect(e.getHeight()).to.equal(dpnsContractBlockHeight);

      expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
        dpnsContractId,
      );

      expect(latestCoreChainLockMock.getChainLock).to.have.not.been.called();
    }
  });

  it('should return nextCoreChainLockUpdate if latestCoreChainLock above header height', async () => {
    chainLockMock.height = 3;

    const response = await endBlockHandler(requestMock);

    expect(latestCoreChainLockMock.getChainLock).to.have.been.calledOnceWithExactly();

    const expectedCoreChainLock = new CoreChainLock({
      coreBlockHeight: chainLockMock.height,
      coreBlockHash: chainLockMock.blockHash,
      signature: chainLockMock.signature,
    });

    expect(response.nextCoreChainLockUpdate).to.deep.equal(expectedCoreChainLock);
  });

  it('should simply return a response if Dashpay contract was not set', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      undefined,
      undefined,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    const response = await endBlockHandler(requestMock);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);
    expect(response.toJSON()).to.be.empty();

    expect(blockExecutionContextMock.hasDataContract).to.not.have.been.called();
  });

  it('should return a response if Dashpay contract is present at specified height', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      dashpayContractBlockHeight,
      dashpayContractId,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    const response = await endBlockHandler(requestMock);

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(response.toJSON()).to.be.empty();

    expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnceWithExactly(
      dashpayContractId,
    );
  });

  it('should throw and error if Dashpay contract is not present at specified height', async () => {
    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      undefined,
      undefined,
      dashpayContractBlockHeight,
      dashpayContractId,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    blockExecutionContextMock.hasDataContract.returns(false);

    try {
      await endBlockHandler(requestMock);

      expect.fail('Error was not thrown');
    } catch (e) {
      expect(e).to.be.an.instanceOf(NoDashpayContractFoundError);
      expect(e.getContractId()).to.equal(dashpayContractId);
      expect(e.getHeight()).to.equal(dashpayContractBlockHeight);

      expect(blockExecutionContextMock.hasDataContract).to.have.been.calledOnce(
        dashpayContractId,
      );

      expect(latestCoreChainLockMock.getChainLock).to.have.not.been.called();
    }
  });
  /* TODO: activate tests when js-abci is ready
  it('should rotate the validator set and return ValidatorSetUpdate if height is dividable by ROTATION_BLOCK_INTERVAL', async () => {
    requestMock = {
      height: 15,
    };

    endBlockHandler = endBlockHandlerFactory(
      blockExecutionContextMock,
      dpnsContractBlockHeight,
      dpnsContractId,
      dashpayContractBlockHeight,
      dashpayContractId,
      simplifiedMasternodeListMock,
      getValidatorSetInfo,
      latestCoreChainLockMock,
      loggerMock,
    );

    const response = await endBlockHandler(requestMock);

    expect(headerMock.lastCommitHash).to.have.been.calledOnce();

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(response.toJSON()).to.be.empty();

    expect(simplifiedMasternodeListMock.getStore).to.have.been.calledOnce();
  });

  it('should rotate the validator set and return ValidatorSetUpdate and nextCoreChainLockUpdate if height is dividable by ROTATION_BLOCK_INTERVAL and if latestCoreChainLock above header height', async () => {
    chainLockMock.height = 3;
    requestMock = {
      height: 15,
    };

    const response = await endBlockHandler(requestMock);

    expect(latestCoreChainLockMock.getChainLock).to.have.been.calledOnceWithExactly();

    const expectedCoreChainLock = new CoreChainLock({
      coreBlockHeight: chainLockMock.height,
      coreBlockHash: chainLockMock.blockHash,
      signature: chainLockMock.signature,
    });
    const expectedValidatorUpdate = new ValidatorSetUpdate({
      validatorUpdates: validatorsUpdateFixture,
      thresholdPublicKey: new PublicKey({
        bls12381: Uint8Array.from(Buffer.from(quorumListFixture[0].quorumPublicKey, 'hex')),
      })
    expect(response.nextCoreChainLockUpdate).to.deep.equal(expectedCoreChainLock);

    expect(response.validatorSetUpdate).to.deep.equal(expectedValidatorUpdate);

    expect(headerMock.lastCommitHash).to.have.been.calledOnce();

    expect(response).to.be.an.instanceOf(ResponseEndBlock);

    expect(response.toJSON()).to.be.empty();

    expect(simplifiedMasternodeListMock.getStore).to.have.been.calledOnce();
  });
  */
});
