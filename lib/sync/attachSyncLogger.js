const ReaderMediator = require('../blockchain/reader/BlockchainReaderMediator');

/**
 *
 * @param {BlockchainReaderMediator} readerMediator
 * @param {Logger} logger
 */
module.exports = function attachSyncLogger(readerMediator, logger) {
  let isInitialSyncFinished = false;

  readerMediator.on(ReaderMediator.EVENTS.OUT_OF_BOUNDS, (params) => {
    const { initialBlockHeight, currentBlockCount } = params;

    logger.info(`Sync is canceled due to initial block height ${initialBlockHeight} `
     + `is higher than the best block chain height ${currentBlockCount}`, params);
  });

  readerMediator.on(ReaderMediator.EVENTS.FULLY_SYNCED, (params) => {
    isInitialSyncFinished = true;

    logger.info('Drive is fully synced', params);
  });

  readerMediator.on(ReaderMediator.EVENTS.BEGIN, (height) => {
    let message;

    if (!isInitialSyncFinished) {
      message = 'Start initial sync process';

      if (height === readerMediator.getInitialBlockHeight()) {
        message += ' from the initial block height';
      } else {
        message += ` from ${height} block`;
      }

      isInitialSyncFinished = true;
    } else {
      message = `Start sync process from ${height} block`;
    }

    logger.info(message, {
      height,
      initialBlockHeight: readerMediator.getInitialBlockHeight(),
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_BEGIN, (block) => {
    logger.info(`Begin processing block with height: ${block.height}`, {
      blockHash: block.hash,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_END, (block) => {
    logger.info(`End processing block with height: ${block.height}`, {
      blockHash: block.hash,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_SEQUENCE_UNVALIDATABLE, (params) => {
    const { height, firstSyncedBlockHeight } = params;
    logger.info(`Block sequence can't be validated for height: ${height}`
      + ` as it is less or equal first synced block height: ${firstSyncedBlockHeight}`);
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_STALE, (block) => {
    logger.info(`Stale block received on height: ${block.height}`, {
      blockHash: block.hash,
      previousBlockHash: block.previousblockhash,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_ERROR, (params) => {
    const { error, block, stateTransition } = params;
    logger.error(`Error occurred during processing of a block with a height: ${block.height}`
      + ` here is the stack: \n${error.stack}`, {
      blockHash: block.hash,
      transitionId: stateTransition.id,
      errorMessage: error.message,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_SKIP, (block) => {
    logger.info(`Skipping processing block with height: ${block.height}`, {
      blockHash: block.hash,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION, (params) => {
    const { block, stateTransition } = params;
    logger.info(`Processing state transition for block with height: ${block.height}`, {
      blockHash: block.hash,
      transitionId: stateTransition.id,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION_STALE, (params) => {
    const { block, stateTransition } = params;
    logger.info(`Stale state transition received for block with height: ${block.height}`, {
      blockHash: block.hash,
      transitionId: stateTransition.id,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.END, (readHeight) => {
    logger.info(`End syncing on height: ${readHeight}`);
  });

  readerMediator.on(ReaderMediator.EVENTS.RESET, () => {
    logger.info('Sync state has been reset');
  });
};
