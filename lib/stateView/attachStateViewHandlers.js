const STHeadersReader = require('../blockchain/reader/STHeadersReader');

/**
 * Attach StateView handlers
 *
 * @param {STHeadersReader|STHeadersReaderMock} stHeadersReader
 * @param {applyStateTransition} applyStateTransition
 * @param {revertDapContractsForBlock} revertDapContractsForBlock
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 */
function attachStateViewHandlers(
  stHeadersReader,
  applyStateTransition,
  revertDapContractsForBlock,
  dropMongoDatabasesWithPrefix,
) {
  stHeadersReader.on(STHeadersReader.EVENTS.HEADER, async ({ header, block }) => {
    await applyStateTransition(header, block);
  });

  stHeadersReader.on(STHeadersReader.EVENTS.STALE_BLOCK, revertDapContractsForBlock);

  stHeadersReader.on(STHeadersReader.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStateViewHandlers;
