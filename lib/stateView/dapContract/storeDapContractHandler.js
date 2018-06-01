/**
 * Store DAP contract handler
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {storeDapContract} storeDapContract
 */
function storeDapContractHandler(stHeadersReader, storeDapContract) {
  stHeadersReader.on('header', async (header) => {
    const cid = header.getPacketCID();
    await storeDapContract(cid);
  });
}

module.exports = storeDapContractHandler;
