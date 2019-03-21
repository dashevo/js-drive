const STPacket = require('@dashevo/dpp/lib/stPacket/STPacket');

const getContractFixture = require('./getContractFixture');
const getDPObjectsFixture = require('./getDPObjectsFixture');

/**
 * @return {STPacket[]}
 */
function getSTPacketsFixture() {
  const dpContract = getContractFixture();
  const dpObjects = getDPObjectsFixture();

  const contractId = dpContract.getId();

  return [
    new STPacket(contractId, dpContract),
    new STPacket(contractId, dpObjects.slice(0, 2)),
    new STPacket(contractId, dpObjects.slice(2)),
  ];
}

module.exports = getSTPacketsFixture;
