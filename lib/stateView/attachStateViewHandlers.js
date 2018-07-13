/**
 * Attach StateView handlers
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {computeStateView} computeStateView
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 */
function attachStateViewHandlers(
  stHeadersReader,
  computeStateView,
  dropMongoDatabasesWithPrefix,
) {
  stHeadersReader.on('header', async (header, block) => {
    await computeStateView(header, block);
  });

  stHeadersReader.on('reset', async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStateViewHandlers;
