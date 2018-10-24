const Emittery = require('emittery');

const InvalidBlockHeightError = require('../../iterator/InvalidBlockHeightError');

class STHeadersReader extends Emittery {
  /**
   * @param {StateTransitionHeaderIterator} stHeaderIterator
   * @param {STHeadersReaderState} state
   * @param {number} initialBlockHeight
   */
  constructor(stHeaderIterator, state, initialBlockHeight) {
    super();

    this.stHeaderIterator = stHeaderIterator;
    this.state = state;

    this.initialBlockHeight = initialBlockHeight;

    this.previousIteratedBlock = null;
  }

  /**
   * Read ST headers and emit events
   */
  async read() {
    await this.emitSerial(
      STHeadersReader.EVENTS.BEGIN,
      this.stHeaderIterator.blockIterator.getBlockHeight(),
    );

    for (; ;) {
      let done;
      let header;
      let currentBlock;
      let processedHeadersForCurrentBlock = [];

      try { // Catch errors for block sync
        ({
          done,
          value: {
            transaction: header,
            block: currentBlock,
          },
        } = await this.stHeaderIterator.next());

        if (currentBlock !== this.previousIteratedBlock) { // Iterate over new block
          processedHeadersForCurrentBlock = [];

          const isValid = await this.handleNewBlock(currentBlock);
          if (!isValid) {
            // eslint-disable-next-line no-continue
            continue;
          }
        }

        if (!done) {
          // Emit current header
          await this.emitSerial(STHeadersReader.EVENTS.HEADER, {
            header,
            block: currentBlock,
          });

          processedHeadersForCurrentBlock.push(header);
        }
      } catch (error) {
        if (error instanceof InvalidBlockHeightError) {
          if (error.blockHeight === this.initialBlockHeight) {
            throw error;
          }

          this.state.clear();

          await this.emit(STHeadersReader.EVENTS.RESET);

          this.restartIterator(this.initialBlockHeight);

          // eslint-disable-next-line no-continue
          continue;
        }

        // TODO: Attempts

        await this.emitSerial(STHeadersReader.EVENTS.BLOCK_ERROR, {
          error,
          block: currentBlock,
          header,
        });

        // Emit stale header for all previously synced headers
        // form the current block
        for (const staleHeader of processedHeadersForCurrentBlock.reverse()) {
          await this.emitSerial(STHeadersReader.EVENTS.HEADER_STALE, {
            header: staleHeader,
            block: currentBlock,
          });
        }

        this.restartIterator(currentBlock.height);

        // eslint-disable-next-line no-continue
        continue;
      }

      if (done) {
        await this.emitSerial(
          STHeadersReader.EVENTS.END,
          this.stHeaderIterator.blockIterator.getBlockHeight(),
        );

        break;
      }
    }
  }

  /**
   *
   * @return {number}
   */
  getInitialBlockHeight() {
    return this.initialBlockHeight;
  }

  /**
   * Get state
   *
   * @return {STHeadersReaderState}
   */
  getState() {
    return this.state;
  }

  /**
   * @private
   * @param {object} currentBlock
   * @return {Promise<boolean>}
   */
  async handleNewBlock(currentBlock) {
    // TODO: Is it called for the last block?

    if (this.previousIteratedBlock) { // Previous block end
      // Mark block as read
      this.state.addBlock(currentBlock);

      await this.emitSerial(STHeadersReader.EVENTS.BLOCK_END, this.previousIteratedBlock);
    }

    this.previousIteratedBlock = currentBlock;

    const previousSyncedBlock = this.state.getLastBlock();

    // Do we have enough synced blocks to verify sequence?
    if (this.isNotAbleToVerifySequence(currentBlock, previousSyncedBlock)) {
      this.state.clear();

      await this.emit(STHeadersReader.EVENTS.RESET);

      this.restartIterator(this.initialBlockHeight);

      return false;
    }

    if (this.isWrongSequence(currentBlock, previousSyncedBlock)) {
      this.state.removeLastBlock();

      await this.emitSerial(STHeadersReader.EVENTS.STALE_BLOCK, previousSyncedBlock);

      // TODO: Emit stale headers

      let nextBlockHeight = currentBlock.height - 1;

      // if the previous synced block is higher then stay with the current block from chain
      if (previousSyncedBlock.height >= currentBlock.height) {
        nextBlockHeight = currentBlock.height;
      }

      this.restartIterator(nextBlockHeight);

      return false;
    }

    await this.emitSerial(STHeadersReader.EVENTS.BLOCK_BEGIN, currentBlock);

    return true;
  }

  /**
   * @private
   * @param currentBlock
   * @param previousBlock
   * @return {boolean}
   */
  isNotAbleToVerifySequence(currentBlock, previousBlock) {
    if (!previousBlock) {
      if (currentBlock.height !== this.initialBlockHeight) {
        // The state doesn't contain synced blocks and
        // current block's height is not initial blocks height
        return true;
      }
    } else if (currentBlock.height < previousBlock.height
      && previousBlock.height - currentBlock.height - 2 > this.state.getBlocksLimit()) {
      // The state doesn't contain previous block for current block
      return true;
    }

    return false;
  }

  /**
   * @private
   * @param currentBlock
   * @param previousBlock
   * @return {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isWrongSequence(currentBlock, previousBlock) {
    return previousBlock
      && currentBlock.previousblockhash
      && currentBlock.previousblockhash !== previousBlock.hash;
  }

  /**
   * @private
   * @param {number} height
   * @throws ResetIteratorError
   */
  restartIterator(height) {
    this.previousIteratedBlock = null;
    this.stHeaderIterator.reset(true);
    this.stHeaderIterator.blockIterator.setBlockHeight(height);
  }
}

STHeadersReader.EVENTS = {
  BEGIN: 'begin',
  HEADER: 'header',
  HEADER_STALE: 'headerStale',
  BLOCK_BEGIN: 'blockBegin',
  BLOCK_END: 'blockEnd',
  BLOCK_ERROR: 'blockError',
  RESET: 'reset',
  STALE_BLOCK: 'staleBlock',
  END: 'end',
};

module.exports = STHeadersReader;
