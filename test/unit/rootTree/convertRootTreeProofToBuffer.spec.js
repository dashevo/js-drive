const convertRootTreeProofToBuffer = require('../../../lib/rootTree/convertRootTreeProofToBuffer');

describe('convertRootTreeProofToBuffer', () => {
  let proof;

  beforeEach(() => {
    proof = [
      Buffer.from('dcd980a26eb0b96668c972357fc67bf02169f884', 'hex'),
      Buffer.from('388f19cf5b6f2e1331e2c9130792972070d0ae37', 'hex'),
    ];
  });

  it('should convert root tree hash to buffer', async () => {
    const result = convertRootTreeProofToBuffer(proof);

    expect(result).to.be.an.instanceOf(Buffer);
    expect(result.toString('hex')).to.equal(
      '02dcd980a26eb0b96668c972357fc67bf02169f884388f19cf5b6f2e1331e2c9130792972070d0ae37',
    );
  });
});
