const fs = require('fs');

module.exports = function getRawStateTransitionPackets() {
  const packetsJSON = fs.readFileSync(`${__dirname}/../../../test/fixtures/stateTransitionPackets.json`);
  return JSON.parse(packetsJSON);
};
