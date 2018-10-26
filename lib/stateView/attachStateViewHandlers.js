const SyncEventBus = require('../blockchain/reader/BlockchainReaderMediator');

/**
 * Attach StateView handlers
 *
 * @param {SyncEventBus} syncEventBus
 * @param {applyStateTransition} applyStateTransition
 * @param {dropMongoDatabasesWithPrefix} dropMongoDatabasesWithPrefix
 * @param {string} mongoDbPrefix
 */
function attachStateViewHandlers(
  syncEventBus,
  applyStateTransition,
  dropMongoDatabasesWithPrefix,
  mongoDbPrefix,
) {
  syncEventBus.on(SyncEventBus.EVENTS.STATE_TRANSITION, async ({ stateTransition, block }) => {
    await applyStateTransition(stateTransition, block);
  });

  syncEventBus.on(SyncEventBus.EVENTS.RESET, async () => {
    await dropMongoDatabasesWithPrefix(mongoDbPrefix);
  });
}

module.exports = attachStateViewHandlers;
