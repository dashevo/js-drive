const { ChainLock } = require('@dashevo/dashcore-lib');
const ZMQClient = require('@dashevo/dashd-zmq');
const waitForEvent = require('../util/waitForEvent');

async function ensureBlock(socketClient, rpcClient, hash) {
  try {
    await rpcClient.getBlock(hash);
  } catch (e) {
    // Block not found
    if (e.code === -5) {
      await waitForEvent(socketClient, ZMQClient.TOPICS.hashblock, hash);
    }
  }
}
/**
 * Check that core is synced (factory)
 *
 * @param {ZMQClient} coreZMQClient
 * @param {RpcClient} coreRpcClient
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {Logger} logger
 *
 * @returns {waitForCoreSync}
 */
function waitForCoreChainLockSyncFactory(
  coreZMQClient,
  coreRpcClient,
  latestCoreChainLock,
  logger,
) {
  /**
   * Check that chainLock is synced
   *
   * @typedef waitForCoreChainLockSync
   *
   * @returns {Promise<void>}
   */
  async function waitForCoreChainLockSync() {
    await coreZMQClient.connect();
    // listens to ChainLock zmq zmqpubrawchainlocksig event and updates the latestCoreChainLock.
    // If we lost connection with Core (heartbeats with retry policy) we need to exit with fatal
    // In case of regtest fallback we need to listen for new blocks using hashblock zmq event
    coreZMQClient.subscribe(ZMQClient.TOPICS.rawchainlock);
    logger.info('Subscribe to rawchainlock ZMQ room');

    coreZMQClient.on(ZMQClient.TOPICS.rawchainlock, async (rawChainLockMessage) => {
      const socketChainLock = new ChainLock(rawChainLockMessage);
      logger.info(`Received new chainlock ${socketChainLock.toString()}`);
      await ensureBlock(coreZMQClient, coreRpcClient, socketChainLock.blockHash);
      latestCoreChainLock.update(socketChainLock);
    });

    // Because a Chainlock may happen before its block, we also subscribe to rawblock
    coreZMQClient.subscribe(ZMQClient.TOPICS.hashblock);
    logger.info('Subscribe to hashblock ZMQ room');

    // We need to retrieve latest chainlock from our fully synced DashCore instance
    try {
      const rpcBestChainLockResponse = await coreRpcClient.getBestChainLock();
      const chainlock = new ChainLock(rpcBestChainLockResponse.result);

      await ensureBlock(coreZMQClient, coreRpcClient, chainlock.blockHash);
      latestCoreChainLock.update(chainlock);

      if (!latestCoreChainLock.chainLock) {
        logger.info('Waiting for a new chainlock');
        // We need to wait for new chainlock from ZMQ socket
        await waitForEvent(coreZMQClient, ZMQClient.TOPICS.rawchainlock);
      }
    } catch (e) {
      // Unable to find any chainlock
      if (e.code === -32603) {
        logger.info('Waiting for a new chainlock');
        await waitForEvent(coreZMQClient, ZMQClient.TOPICS.rawchainlock);
      }
    }

    return {
      latestCoreChainLock,
    };
  }

  return waitForCoreChainLockSync;
}

module.exports = waitForCoreChainLockSyncFactory;
