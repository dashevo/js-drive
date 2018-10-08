const Reference = require('../../../../lib/stateView/Reference');
const DapContract = require('../../../../lib/stateView/dapContract/DapContract');

describe('DapContract', () => {
  it('should serialize DapContract', () => {
    const dapId = '123456';
    const dapName = 'DashPay';
    const reference = new Reference();
    const schema = {};
    const version = 2;
    const previousRevisions = [];
    const dapContract = new DapContract(
      dapId,
      dapName,
      reference,
      schema,
      version,
      previousRevisions,
    );

    const dapContractSerialized = dapContract.toJSON();
    expect(dapContractSerialized).to.deep.equal({
      dapId,
      dapName,
      reference,
      schema,
      version,
      previousRevisions,
    });
  });
});
