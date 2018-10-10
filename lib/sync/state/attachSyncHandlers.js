const STHeadersReader = require('../../blockchain/reader/STHeadersReader');

/**
 * Persist sync state
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {SyncState} syncState
 * @param {SyncStateRepository} syncStateRepository
 */
function attachSyncHandlers(stHeadersReader, syncState, syncStateRepository) {
  const readerState = stHeadersReader.getState();

  async function saveState() {
    syncState.setBlocks(readerState.getBlocks());

    await syncStateRepository.store(syncState);
  }

  stHeadersReader.on(STHeadersReader.EVENTS.BLOCK, async () => {
    await saveState();
  });
  stHeadersReader.on(STHeadersReader.EVENTS.STALE_BLOCK, async () => {
    await saveState();
  });

  stHeadersReader.on(STHeadersReader.EVENTS.END, async () => {
    syncState.setBlocks(readerState.getBlocks());

    syncState.updateLastSyncAt(new Date());

    await syncStateRepository.store(syncState);
  });
}

module.exports = attachSyncHandlers;
