const BlockchainReaderMediator = require('../BlockchainReaderMediator');
const RestartIteratorError = require('../RestartBlockchainReaderError');

/**
 * @param {BlockchainReaderMediator} readerMediator
 * @param {{ maxRetries: number, skipBlockWithErrors: boolean}} options
 * @return {STReader}
 */
module.exports = function attachBlockErrorsHandler(readerMediator, options) {
  const { maxRetries, skipBlockWithErrors } = Object.assign({
    maxRetries: 5,
    skipBlockWithErrors: false,
  }, options);

  let retryCount = 0;
  let stateTransitionsFromCurrentBlock = [];

  function collectStateTransitions({ stateTransitions }) {
    stateTransitionsFromCurrentBlock.push(stateTransitions);
  }

  function resetRetryState() {
    retryCount = 0;
    stateTransitionsFromCurrentBlock = [];
  }

  /**
   * @param {{ error: Error, block: object, stateTransition: StateTransitionHeader}} eventPayload
   */
  async function handleErrors(eventPayload) {
    const { error, block } = eventPayload;

    // We reached our error limit for the current block processing
    if (retryCount > maxRetries) {
      resetRetryState();

      throw error;
    }

    retryCount += 1;

    // If we want to skip block processing with errors
    // and we still have something to read
    if (skipBlockWithErrors) {
      await this.readerMediator.emitSerial(
        // TODO: Error handler not handle BLOCK_SKIP
        BlockchainReaderMediator.EVENTS.BLOCK_SKIP,
        eventPayload,
      );

      // Move iterator to the next block if present
      if (block.nextblockhash) {
        throw new RestartIteratorError(block.height + 1);
      }

      // Return height if it is the last block
      return;
    }

    // Emit stale header for all previously synced headers
    // form the current block
    for (const staleStateTransition of stateTransitionsFromCurrentBlock.reverse()) {
      // TODO: Error handler not handle STATE_TRANSITION_STALE
      await this.readerMediator.emitSerial(BlockchainReaderMediator.EVENTS.STATE_TRANSITION_STALE, {
        stateTransition: staleStateTransition,
        block,
      });
    }

    throw new RestartIteratorError(block.height);
  }

  readerMediator.on(BlockchainReaderMediator.EVENTS.STATE_TRANSITION, collectStateTransitions);
  readerMediator.on(BlockchainReaderMediator.EVENTS.BLOCK_END, resetRetryState);
  readerMediator.on(BlockchainReaderMediator.EVENTS.BLOCK_ERROR, handleErrors);
};
