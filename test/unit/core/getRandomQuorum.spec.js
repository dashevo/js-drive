const { QuorumEntry } = require('@dashevo/dashcore-lib');
const { expect } = require('chai');
const getRandomQuorum = require('../../../lib/core/getRandomQuorum');

describe('getRandomQuorum', () => {
  let smlMock;
  let quorumType;

  beforeEach(function beforeEach() {
    smlMock = {
      getQuorumsOfType: this.sinon.stub(),
      getQuorum: this.sinon.stub(),
    };

    quorumType = 1;

    smlMock.getQuorumsOfType.returns([
      {
        quorumHash: Buffer.alloc(1, 32).toString('hex'),
      },
    ]);

    smlMock.getQuorum.returns(new QuorumEntry());
  });

  it('should return random quorum based on entropy', () => {
    const result = getRandomQuorum(smlMock, quorumType, Buffer.alloc(1));

    expect(smlMock.getQuorumsOfType).to.have.been.calledOnceWithExactly(quorumType);
    expect(smlMock.getQuorum).to.have.been.calledOnceWithExactly(
      quorumType, '20',
    );
    expect(result).to.be.an.instanceOf(QuorumEntry);
  });

  // TODO: Probably there are more cases
});
