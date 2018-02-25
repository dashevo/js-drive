const WrongBlocksSequenceError = require('../../lib/blockchain/WrongBlocksSequenceError');

/**
 * Add State Transitions from blockchain
 *
 * @param {IpfsAPI} ipfsAPI
 * @param {StateTransitionHeaderIterator} stHeaderIterator
 * @param {number} unstableBlocksDepth
 */
async function addStateTransitionsFromBlockchain(
  ipfsAPI,
  stHeaderIterator,
  unstableBlocksDepth = 10,
) {
  for (; ;) {
    let result;

    try {
      result = await stHeaderIterator.next();
    } catch (e) {
      if (!(e instanceof WrongBlocksSequenceError)) {
        throw e;
      }

      stHeaderIterator.reset(true);

      let stableBlockHeight = stHeaderIterator.blockIterator.blockHeight - unstableBlocksDepth;
      if (stableBlockHeight < 1) {
        stableBlockHeight = 1;
      }

      // eslint-disable-next-line no-param-reassign
      stHeaderIterator.blockIterator.blockHeight = stableBlockHeight;

      // TODO: Unpin ST packets which added since stableBlockHeight

      // eslint-disable-next-line no-continue
      continue;
    }

    if (result.done) {
      break;
    }

    // TODO: Check number of confirmations. Should be more or equal than 6?
    // TODO: Validate packet using header?

    await ipfsAPI.pin.add(result.value.storageHash, { recursive: true });
  }
}

module.exports = addStateTransitionsFromBlockchain;
