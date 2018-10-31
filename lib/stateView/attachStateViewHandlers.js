const ReaderMediator = require('../blockchain/reader/BlockchainReaderMediator');

/**
 * Attach StateView handlers
 *
 * @param {BlockchainReaderMediator} readerMediator
 * @param {applyStateTransition} applyStateTransition
 * @param {revertDapContractsForHeader} revertDapContractsForHeader
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 * @param {string} mongoDbPrefix
 */
function attachStateViewHandlers(
  readerMediator,
  applyStateTransition,
  revertDapContractsForHeader,
  dropMongoDatabasesWithPrefix,
  mongoDbPrefix,
) {
  readerMediator.on(ReaderMediator.EVENTS.STATE_TRANSITION, async ({ stateTransition, block }) => {
    await applyStateTransition(stateTransition, block);
  });

  readerMediator.on(ReaderMediator.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(mongoDbPrefix);
  stHeadersReader.on(STHeadersReader.EVENTS.STALE_HEADER, revertDapContractsForHeader);

  stHeadersReader.on(STHeadersReader.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStateViewHandlers;
