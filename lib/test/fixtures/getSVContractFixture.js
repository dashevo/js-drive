const SVContract = require('../../stateView/contract/SVContract');

const getContractFixture = require('./getContractFixture');
const getReferenceFixture = require('./getReferenceFixture');
const getDPObjectsFixture = require('./getDPObjectsFixture');

function getSVContractFixture() {
  const { userId } = getDPObjectsFixture;

  const contract = getContractFixture();
  const reference = getReferenceFixture();

  const contractId = contract.getId();

  return new SVContract(
    contractId,
    userId,
    contract,
    reference,
  );
}

module.exports = getSVContractFixture;
