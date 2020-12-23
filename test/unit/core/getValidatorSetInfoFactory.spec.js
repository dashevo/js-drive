const getValidatorSetInfoFactory = require('../../../lib/core/getValidatorSetInfoFactory');

describe('getValidatorSetInfo', () => {
  let coreRpcClientMock;
  let validators;
  let llmqType;
  let quorumHash;
  let getValidatorSetInfo;

  beforeEach(() => {
    coreRpcClientMock = {
      quorum: this.sinon.stub().resolves({
        result: {
          members: validators,
        },
        error: null,
        id: 5,
      }),
      getBlock: this.sinon.stub(),
    };
    getValidatorSetInfo = getValidatorSetInfoFactory(coreRpcClientMock);
    llmqType = 4;
    quorumHash = '36252dfdf79b1b8a95141d32a4c66353a88e439506f036867d7949a5ca7d8a37';
  });

  it('should get quorum info ', async () => {
    const validatorSetInfo = getValidatorSetInfo(llmqType, quorumHash);
    expect(validatorSetInfo).to.deep.equal({validators
    });
  });
});
