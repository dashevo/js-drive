const SyncEventBus = require('../../blockchain/reader/BlockchainReaderMediator');

/**
 * Persist sync state
 *
 * @param {SyncEventBus} syncEventBus
 * @param {STReader} stReader
 * @param {SyncState} syncState
 * @param {SyncStateRepository} syncStateRepository
 */
function attachSyncHandlers(syncEventBus, stReader, syncState, syncStateRepository) {
  const readerState = stReader.getState();

  async function saveState() {
    syncState.setBlocks(readerState.getBlocks());

    await syncStateRepository.store(syncState);
  }

  syncEventBus.on(SyncEventBus.EVENTS.BLOCK_END, saveState);
  syncEventBus.on(SyncEventBus.EVENTS.BLOCK_STALE, saveState);

  syncEventBus.on(SyncEventBus.EVENTS.END, async () => {
    syncState.updateLastSyncAt(new Date());

    await syncStateRepository.store(syncState);
  });
}

module.exports = attachSyncHandlers;
