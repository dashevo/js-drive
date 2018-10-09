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

  it('should add revision to DapContract', () => {
    const firstDapId = '1234';
    const firstDapName = 'DashPay';
    const firstReference = new Reference();
    const firstSchema = {};
    const firstVersion = 1;
    const firstPreviousVersions = [];
    const firstDapContract = new DapContract(
      firstDapId,
      firstDapName,
      firstReference,
      firstSchema,
      firstVersion,
      firstPreviousVersions,
    );

    const secondDapId = '5678';
    const secondDapName = 'DashPay';
    const secondReference = new Reference();
    const secondSchema = {};
    const secondVersion = 2;
    const secondPreviousRevisions = [firstDapContract.currentRevision()];
    const secondDapContract = new DapContract(
      secondDapId,
      secondDapName,
      secondReference,
      secondSchema,
      secondVersion,
      secondPreviousRevisions,
    );

    const thirdDapId = '9999';
    const thirdDapName = 'DashPay';
    const thirdReference = new Reference();
    const thirdSchema = {};
    const thirdVersion = 2;
    const thirdPreviousRevisions = [];
    const thirdDapContract = new DapContract(
      thirdDapId,
      thirdDapName,
      thirdReference,
      thirdSchema,
      thirdVersion,
      thirdPreviousRevisions,
    );

    thirdDapContract.addRevision(secondDapContract);

    expect(thirdDapContract.getPreviousRevisions()).to.be.deep.equal([
      firstDapContract.currentRevision(),
      secondDapContract.currentRevision(),
    ]);
  });
});
