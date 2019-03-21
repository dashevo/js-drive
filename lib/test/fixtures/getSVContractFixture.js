const SVContract = require('../../stateView/contract/SVContract');

const getContractFixture = require('./getContractFixture');
const getReferenceFixture = require('./getReferenceFixture');
const getDPObjectsFixture = require('./getDPObjectsFixture');

function getSVContractFixture() {
  const { userId } = getDPObjectsFixture;

  const dpContract = getContractFixture();
  const reference = getReferenceFixture();

  const contractId = dpContract.getId();

  return new SVContract(
    contractId,
    userId,
    dpContract,
    reference,
  );
}

module.exports = getSVContractFixture;
