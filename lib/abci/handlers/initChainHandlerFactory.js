const {
  abci: {
    ResponseInitChain,
  },
} = require('abci/types');
const { ChainLock } = require('@dashevo/dashcore-lib');
const waitForEvent = require('../../util/waitForEvent');
/**
 * Init Chain ABCI handler
 *
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {BlockchainState} blockchainState
 * @param {ZMQClient} coreZMQClient
 * @param {RpcClient} coreRpcClient
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  latestCoreChainLock,
  blockchainState,
  coreZMQClient,
  coreRpcClient,
  logger,
) {
  /**
   * @typedef endBlockHandler
   *
   * @param {abci.RequestInitChain} request
   * @return {Promise<abci.ResponseInitChain>}
   */
  async function initChainHandler() {
    logger.info('Init chain');

    // We need to retrieve latest chainlock from our fully synced DashCore instance
    const rpcBestChainLockResponse = await coreRpcClient.getBestChainLock();

    const chainlock = new ChainLock(rpcBestChainLockResponse);
    latestCoreChainLock.update(chainlock);

    const zmqSocket = coreZMQClient.connect();
    zmqSocket.subscribe(coreZMQClient.ROOMS.rawchainlock);
    logger.info('Subscribe to rawchainlock ZMQ room');

    // listens to ChainLock zmq zmqpubrawchainlocksig event and updates the latestCoreChainLock.
    // If we lost connection with Core (heartbeats with retry policy) we need to exit with fatal
    // In case of regtest fallback we need to listen for new blocks using hashblock zmq event
    zmqSocket.on(coreZMQClient.ROOMS.rawchainlock, (rawChainLockMessage) => {
      const socketChainLock = new ChainLock(rawChainLockMessage);
      logger.info(`Received new chainlock ${socketChainLock.toString()}`);
      latestCoreChainLock.update(socketChainLock);
    });

    if (!latestCoreChainLock.chainLock) {
      // We need to wait for new chainlock from ZMQ socket
      await waitForEvent(zmqSocket, coreZMQClient.ROOMS.rawchainlock);
    }

    return new ResponseInitChain({
      latestCoreChainLock,
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
