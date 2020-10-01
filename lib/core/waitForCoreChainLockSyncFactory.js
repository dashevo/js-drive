const { ChainLock } = require('@dashevo/dashcore-lib');
const waitForEvent = require('../util/waitForEvent');

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
    // We need to retrieve latest chainlock from our fully synced DashCore instance
    const rpcBestChainLockResponse = await coreRpcClient.getBestChainLock();

    const chainlock = new ChainLock(rpcBestChainLockResponse.result);
    latestCoreChainLock.update(chainlock);

    const zmqSocket = coreZMQClient.connect();
    zmqSocket.subscribe(coreZMQClient.TOPICS.rawchainlock);
    logger.info('Subscribe to rawchainlock ZMQ room');

    // listens to ChainLock zmq zmqpubrawchainlocksig event and updates the latestCoreChainLock.
    // If we lost connection with Core (heartbeats with retry policy) we need to exit with fatal
    // In case of regtest fallback we need to listen for new blocks using hashblock zmq event
    zmqSocket.on(coreZMQClient.TOPICS.rawchainlock, (rawChainLockMessage) => {
      const socketChainLock = new ChainLock(rawChainLockMessage);
      logger.info(`Received new chainlock ${socketChainLock.toString()}`);

      latestCoreChainLock.update(socketChainLock);
    });

    if (!latestCoreChainLock.chainLock) {
      // We need to wait for new chainlock from ZMQ socket
      await waitForEvent(zmqSocket, coreZMQClient.TOPICS.rawchainlock);
    }
    return {
      latestCoreChainLock,
    };
  }

  return waitForCoreChainLockSync;
}

module.exports = waitForCoreChainLockSyncFactory;
