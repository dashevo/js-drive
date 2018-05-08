const fs = require('fs');

module.exports = function getRawStateTransitionHeaders() {
  const packetsJSON = fs.readFileSync(`${__dirname}/../../../test/fixtures/stateTransitionHeaders.json`);
  return JSON.parse(packetsJSON);
};
