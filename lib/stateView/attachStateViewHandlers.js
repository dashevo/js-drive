const STHeadersReader = require('../blockchain/reader/STHeadersReader');

/**
 * Attach StateView handlers
 *
 * @param {STHeadersReader|STHeadersReaderMock} stHeadersReader
 * @param {applyStateTransition} applyStateTransition
 * @param {revertDapContractsForHeader} revertDapContractsForHeader
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 */
function attachStateViewHandlers(
  stHeadersReader,
  applyStateTransition,
  revertDapContractsForHeader,
  dropMongoDatabasesWithPrefix,
) {
  stHeadersReader.on(STHeadersReader.EVENTS.HEADER, async ({ header, block }) => {
    await applyStateTransition(header, block);
  });

  stHeadersReader.on(STHeadersReader.EVENTS.STALE_HEADER, revertDapContractsForHeader);

  stHeadersReader.on(STHeadersReader.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStateViewHandlers;
