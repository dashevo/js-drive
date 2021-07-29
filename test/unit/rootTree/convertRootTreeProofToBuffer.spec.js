const convertRootTreeProofToBuffer = require('../../../lib/rootTree/convertRootTreeProofToBuffer');

describe('convertRootTreeProofToBuffer', () => {
  let proof;

  beforeEach(() => {
    proof = [
      {
        position: 'right',
        data: Buffer.from('388f19cf5b6f2e1331e2c9130792972070d0ae38', 'hex'),
      },
      {
        position: 'right',
        data: Buffer.from('388f19cf5b6f2e1331e2c9130792972070d0ae37', 'hex'),
      },
      {
        position: 'left',
        data: Buffer.from('dcd980a26eb0b96668c972357fc67bf02169f884', 'hex'),
      },
    ];
  });

  it('should convert root tree hash to buffer', async () => {
    const result = convertRootTreeProofToBuffer(proof);

    expect(result).to.be.an.instanceOf(Buffer);
    expect(result.toString('hex')).to.equal(
      '0100000003388f19cf5b6f2e1331e2c9130792972070d0ae38388f19cf5b6f2e1331e2c9130792972070d0ae37dcd980a26eb0b96668c972357fc67bf02169f8840104',
    );
  });
});
