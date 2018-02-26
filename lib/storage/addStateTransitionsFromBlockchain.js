const addSTPacketByHeader = require('./addSTPacketByHeader');

/**
 * Add State Transitions from blockchain
 *
 * @param {IpfsAPI} ipfsAPI
 * @param {StateTransitionHeaderIterator} stHeaderIterator
 */
module.exports = async function addStateTransitionsFromBlockchain(ipfsAPI, stHeaderIterator) {
  let done;
  let stateTransitionHeader;

  // eslint-disable-next-line no-cond-assign
  while ({ done, value: stateTransitionHeader } = await stHeaderIterator.next()) {
    if (done) {
      break;
    }

    // TODO: Check number of confirmations. Should be more or equal than 6?
    // TODO: Validate packet using header?

    await addSTPacketByHeader(ipfsAPI, stateTransitionHeader);
  }
};
