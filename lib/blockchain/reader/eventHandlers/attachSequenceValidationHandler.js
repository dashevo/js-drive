const ReaderMediator = require('../BlockchainReaderMediator');

const RestartBlockchainReaderError = require('../RestartBlockchainReaderError');

const WrongSequenceError = require('./errors/WrongSequenceError');
const NotAbleToValidateSequenceError = require('./errors/NotAbleToValidateSequenceError');

/**
 *
 * @param {BlockchainReaderMediator} readerMediator
 * @param {createStateTransitionsFromBlock} createStateTransitions
 */
module.exports = function attachSequenceValidationHandler(readerMediator, createStateTransitions) {
  /**
   * @param {object} currentBlock
   * @param {object} previousBlock
   * @return {boolean}
   */
  function isNotAbleToValidateSequence(currentBlock, previousBlock) {
    const blockLimit = readerMediator.getState().getBlocksLimit();

    if (!previousBlock) {
      if (currentBlock.height !== this.initialBlockHeight) {
        // The state doesn't contain synced blocks and
        // current block's height is not initial blocks height
        return true;
      }
    } else if (currentBlock.height < previousBlock.height
      && previousBlock.height - currentBlock.height - 2 > blockLimit) {
      // The state doesn't contain previous block for current block
      return true;
    }

    return false;
  }

  /**
   * @param {object} currentBlock
   * @param {object} previousBlock
   * @return {boolean}
   */
  function isWrongSequence(currentBlock, previousBlock) {
    return previousBlock
      && currentBlock.previousblockhash
      && currentBlock.previousblockhash !== previousBlock.hash;
  }

  /**
   * @param {object} block
   */
  function validateBlockSequence(block) {
    const previousSyncedBlock = readerMediator.getState().getLastBlock();

    // Do we have enough synced blocks to verify sequence?
    if (isNotAbleToValidateSequence(block, previousSyncedBlock)) {
      throw new NotAbleToValidateSequenceError();
    }

    // Is sequence correct?
    if (isWrongSequence(block, previousSyncedBlock)) {
      throw new WrongSequenceError();
    }
  }

  /**
   * @param {Error} error
   * @param {object} block
   * @return {Promise<void>}
   */
  async function restartReaderIfSequenceIsWrong({ error, block }) {
    const previousSyncedBlock = readerMediator.getState().getLastBlock();

    if (error instanceof NotAbleToValidateSequenceError) {
      await readerMediator.reset();

      throw new RestartBlockchainReaderError(readerMediator.getInitialBlockHeight());
    }

    // Restart iterator if block sequence is wrong
    if (error instanceof WrongSequenceError) {
      this.getState().removeLastBlock();

      // Mark block as stale
      await this.readerMediator.emitSerial(
        ReaderMediator.EVENTS.BLOCK_STALE,
        previousSyncedBlock,
      );

      // Mark State Transitions from block as stale
      const staleStateTransitions = await createStateTransitions(previousSyncedBlock);

      for (const staleStateTransition of staleStateTransitions.reverse()) {
        await this.readerMediator.emitSerial(ReaderMediator.EVENTS.STATE_TRANSITION_STALE, {
          stateTransition: staleStateTransition,
          previousSyncedBlock,
        });
      }

      // Calculate next block height
      let nextBlockHeight = block.height - 1;

      // if the previous synced block is higher then stay with the current block from chain
      if (previousSyncedBlock.height >= block.height) {
        nextBlockHeight = block.height;
      }

      throw new RestartBlockchainReaderError(nextBlockHeight);
    }
  }

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_BEGIN, validateBlockSequence);
  readerMediator.on(ReaderMediator.EVENTS.BLOCK_ERROR, restartReaderIfSequenceIsWrong);
};
