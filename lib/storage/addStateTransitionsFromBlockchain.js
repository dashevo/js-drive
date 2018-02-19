/* eslint-disable no-await-in-loop,no-cond-assign */
/**
 * Add State Transitions from blockchain
 *
 * @param ipfsAPI
 * @param {StateTransitionHeaderIterator} stateTransitionHeaderIterator
 * @return {Promise<void>}
 */
async function addStateTransitionsFromBlockchain(ipfsAPI, stateTransitionHeaderIterator) {
  let done;
  let stateTransitionHeader;

  while ({ done, value: stateTransitionHeader } = await stateTransitionHeaderIterator.next()) {
    if (done) {
      break;
    }

    await ipfsAPI.pin.add(stateTransitionHeader.packetMultihash, { recursive: true });
  }
}

module.exports = addStateTransitionsFromBlockchain;
