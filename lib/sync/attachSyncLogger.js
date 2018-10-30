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

    logger.info(`Sync is not started due to initial block height ${initialBlockHeight} `
     + `is higher than the best block chain height ${currentBlockCount}`, params);
  });

  readerMediator.on(ReaderMediator.EVENTS.FULLY_SYNCED, (currentBlockCount) => {
    isInitialSyncFinished = true;

    logger.info('Drive is fully synced', {
      currentBlockCount,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BEGIN, (height) => {
    let message;

    if (!isInitialSyncFinished) {
      message = 'Start initial sync process';

      if (height === readerMediator.getInitialBlockHeight()) {
        message += ' from the initial block height';
      } else {
        message += ` from block ${height}`;
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
    logger.info(`Begin processing block ${block.height}`, {
      hash: block.hash,
      height: block.height,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_END, (block) => {
    logger.info(`End processing block ${block.height}`, {
      hash: block.hash,
      height: block.height,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_SEQUENCE_UNVALIDATABLE, (params) => {
    const { height, firstSyncedBlockHeight } = params;
    logger.info(`Block sequence can't be validated for height: ${height}`
      + ` as it is less or equal first synced block height: ${firstSyncedBlockHeight}`);
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_STALE, (block) => {
    logger.info(`Reverting stale block ${block.height}`, {
      hash: block.hash,
      height: block.height,
      previousBlockHash: block.previousblockhash,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_ERROR, (params) => {
    const { error, block, stateTransition } = params;
    logger.error(
      `Error occurred during processing of a block ${block.height}: ${error.name} ${error.message}`,
      {
        block: {
          hash: block.hash,
          height: block.height,
        },
        error,
        stateTransition: (stateTransition ? { hash: stateTransition.hash } : null),
      },
    );
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_SKIP, (block) => {
    logger.info(`Skipping processing block ${block.height}`, {
      hash: block.hash,
      height: block.height,
    });
  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION, (params) => {
    const { block, stateTransition } = params;
    logger.info(
      `Processing State Transition ${stateTransition.hash} for block ${block.height}`,
      {
        block: {
          hash: block.hash,
          height: block.height,
        },
        stateTransition: {
          hash: stateTransition.hash,
        },
      },
    );
  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION_STALE, (params) => {
    const { block, stateTransition } = params;
    logger.info(
      `Reverting stale State Transition ${stateTransition.hash} for block ${block.height}`,
      {
        block: {
          hash: block.hash,
          height: block.height,
        },
        stateTransition: {
          hash: stateTransition.hash,
        },
      },
    );
  });

  readerMediator.on(ReaderMediator.EVENTS.END, (readHeight) => {
    logger.info(`Sync process is finished on block ${readHeight}`);
  });

  readerMediator.on(ReaderMediator.EVENTS.RESET, () => {
    const initialBlockHeight = readerMediator.getInitialBlockHeight();
    logger.info(
      `Cleanup Drive and restart sync process from initial block ${initialBlockHeight}`,
      {
        initialBlockHeight,
      },
    );
  });
};
