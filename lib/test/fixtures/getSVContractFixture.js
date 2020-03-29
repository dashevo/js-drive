const SVContract = require('../../dataContract/SVContract');

const getDataContractFixture = require('./getDataContractFixture');
const getReferenceFixture = require('./getReferenceFixture');

function getSVContractFixture() {
  const contract = getDataContractFixture();
  const reference = getReferenceFixture();

  return new SVContract(
    contract,
    reference,
  );
}

module.exports = getSVContractFixture;
