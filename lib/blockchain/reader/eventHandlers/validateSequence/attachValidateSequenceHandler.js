const BlockchainReaderMediator = require('../../BlockchainReaderMediator');

const RestartIteratorError = require('../../RestartBlockchainReaderError');

const WrongSequenceError = require('./errors/WrongSequenceError');
const NotAbleToValidateSequenceError = require('./errors/NotAbleToValidateSequenceError');

/**
 *
 * @param {BlockchainReaderMediator} readerMediator
 */
module.exports = function attachValidateSequenceHandler(readerMediator) {
  /**
   * @private
   * @param {object} currentBlock
   * @param {object} previousBlock
   * @return {boolean}
   */
  function isNotAbleToVerifySequence(currentBlock, previousBlock) {
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
   * @private
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
   * @private
   * @param {object} currentBlock
   * @param {object} previousSyncedBlock
   */
  function validateBlockSequence(currentBlock, previousSyncedBlock) {
    // Do we have enough synced blocks to verify sequence?
    if (isNotAbleToVerifySequence(currentBlock, previousSyncedBlock)) {
      throw new NotAbleToValidateSequenceError();
    }

    // Is sequence correct?
    if (isWrongSequence(currentBlock, previousSyncedBlock)) {
      throw new WrongSequenceError();
    }
  }

  readerMediator.on(BlockchainReaderMediator.EVENTS.BLOCK_BEGIN, async (block) => {
    const previousSyncedBlock = readerMediator.getState().getLastBlock();

    validateBlockSequence(block, previousSyncedBlock);
  });

  readerMediator.on(BlockchainReaderMediator.EVENTS.BLOCK_ERROR, async ({ error, block }) => {
    const previousSyncedBlock = readerMediator.getState().getLastBlock();

    if (error instanceof NotAbleToValidateSequenceError) {
      await readerMediator.reset();

      throw new RestartIteratorError(readerMediator.getInitialBlockHeight());
    }

    // Restart iterator if block sequence is wrong
    if (error instanceof WrongSequenceError) {
      this.getState().removeLastBlock();

      // TODO error handler don't handle BLOCK_STALE
      await this.readerMediator.emitSerial(
        BlockchainReaderMediator.EVENTS.BLOCK_STALE,
        previousSyncedBlock,
      );

      // TODO: Emit stale headers

      let nextBlockHeight = block.height - 1;

      // if the previous synced block is higher then stay with the current block from chain
      if (previousSyncedBlock.height >= block.height) {
        nextBlockHeight = block.height;
      }

      throw new RestartIteratorError(nextBlockHeight);
    }
  });
};
