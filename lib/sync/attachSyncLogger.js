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

  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_END, (block) => {

  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_123, (block) => {
    // TODO Can't validate sequence
  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_STALE, (block) => {

  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_ERROR, (params) => {
    const { error, block, stateTransition } = params;

  });

  readerMediator.on(ReaderMediator.EVENTS.BLOCK_SKIP, (block) => {

  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION, (params) => {
    const { block, stateTransition } = params;
  });

  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION_STALE, () => {
    const { block, stateTransition } = params;
  });

  readerMediator.on(ReaderMediator.EVENTS.END, (readHeight) => {

  });

  readerMediator.on(ReaderMediator.EVENTS.RESET, () => {

  });
};
