const fs = require('fs');
const path = require('path');

const StateTransitionHeader = require('../../blockchain/StateTransitionHeader');

/**
 * @return {StateTransitionHeader[]}
 */
module.exports = function getTransitionHeaderFixtures() {
  const transitionHeadersJSON = fs.readFileSync(path.join(__dirname, '/../../../test/fixtures/stateTransitionHeaders.json'));
  return JSON.parse(transitionHeadersJSON.toString());
};
