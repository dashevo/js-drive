/**
 * Store DAP contract handler
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {storeDapContract} storeDapContract
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 */
function attachStoreDapContractHandler(
  stHeadersReader,
  storeDapContract,
  dropMongoDatabasesWithPrefix,
) {
  stHeadersReader.on('header', async (header) => {
    const cid = header.getPacketCID();
    await storeDapContract(cid);
  });

  stHeadersReader.on('reset', async () => {
    await dropMongoDatabasesWithPrefix(process.env.MONGODB_DB_PREFIX);
  });
}

module.exports = attachStoreDapContractHandler;
