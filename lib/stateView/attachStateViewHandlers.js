const STHeadersReader = require('../blockchain/reader/STHeadersReader');

/**
 * Attach StateView handlers
 *
 * @param {STHeadersReader|STHeadersReaderMock} stHeadersReader
 * @param {applyStateTransition} applyStateTransition
 * @param {applyReorgForDapContract} applyReorgForDapContract
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 */
function attachStateViewHandlers(
  stHeadersReader,
  applyStateTransition,
  applyReorgForDapContract,
  dropMongoDatabasesWithPrefix,
) {
  stHeadersReader.on(STHeadersReader.EVENTS.HEADER, async ({ header, block }) => {
    await applyStateTransition(header, block);
  });

  stHeadersReader.on(STHeadersReader.EVENTS.STALE_BLOCK, async (staleBlock) => {
    await applyReorgForDapContract(staleBlock);
  });

  stHeadersReader.on(STHeadersReader.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStateViewHandlers;
