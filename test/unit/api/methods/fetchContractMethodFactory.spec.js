const fetchContractMethodFactory = require('../../../../lib/api/methods/fetchContractMethodFactory');

const getDPContractFixture = require('../../../../lib/test/fixtures/getDPContractFixture');

const InvalidParamsError = require('../../../../lib/api/InvalidParamsError');

describe('fetchContractMethodFactory', () => {
  let dpContract;
  let contractId;
  let fetchContractMethod;
  let fetchContractMock;

  beforeEach(function beforeEach() {
    dpContract = getDPContractFixture();
    contractId = dpContract.getId();

    fetchContractMock = this.sinon.stub();
    fetchContractMethod = fetchContractMethodFactory(fetchContractMock);
  });

  it('should throw InvalidParamsError if Contract ID is not provided', async () => {
    let error;
    try {
      await fetchContractMethod({});
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(InvalidParamsError);

    expect(fetchContractMock).to.have.not.been.called();
  });

  it('should throw error if DP Contract is not found', async () => {
    fetchContractMock.returns(null);

    let error;
    try {
      await fetchContractMethod({ contractId });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an.instanceOf(InvalidParamsError);

    expect(fetchContractMock).to.have.been.calledOnceWith(contractId);
  });

  it('should return DP contract', async () => {
    fetchContractMock.returns(dpContract);

    const result = await fetchContractMethod({ contractId });

    expect(result).to.deep.equal(dpContract.toJSON());

    expect(fetchContractMock).to.have.been.calledOnceWith(contractId);
  });
});
