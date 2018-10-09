/* eslint-disable no-console */
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
    console.log(`Sync block: ${readerState.getLastBlock().height}`);

    await saveState();
  });
  stHeadersReader.on(STHeadersReader.EVENTS.STALE_BLOCK, async () => {
    console.log(`Sync stale block: ${readerState.getLastBlock().height}`);

    await saveState();
  });

  stHeadersReader.on(STHeadersReader.EVENTS.END, async () => {
    console.log(`End sync: ${readerState.getLastBlock().height}`);

    syncState.setBlocks(readerState.getBlocks());

    syncState.updateLastSyncAt(new Date());

    await syncStateRepository.store(syncState);
  });
}

module.exports = attachSyncHandlers;
