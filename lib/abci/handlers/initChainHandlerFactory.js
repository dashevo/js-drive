const zmq = require('zeromq');
const {
  abci: {
    ResponseInitChain,
  },
} = require('abci/types');
const { ChainLock } = require('@dashevo/dashcore-lib');
/**
 * Init Chain ABCI handler
 *
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {BlockchainState} blockchainState
 * @param {RpcClient} coreRpcClient
 * @param {BaseLogger} logger
 *
 * @return {initChainHandler}
 */
function initChainHandlerFactory(
  latestCoreChainLock,
  blockchainState,
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

    if (!rpcBestChainLockResponse) {
      // We need to wait for new chainlock from ZMQ socket
    }

    const chainlock = new ChainLock(rpcBestChainLockResponse);
    latestCoreChainLock.update(chainlock);

    const zmqEndpoint = coreRpcClient.getZmqSockets().rawchainlock;
    const zmqChainLockSocket = zmq.socket('pull');

    zmqChainLockSocket.connect(zmqEndpoint);
    logger.info(`ZMQ socket opened on ${zmqEndpoint}`);

    // listens to ChainLock zmq zmqpubrawchainlocksig event and updates the latestCoreChainLock.
    // If we lost connection with Core (heartbeats with retry policy) we need to exit with fatal
    // In case of regtest fallback we need to listen for new blocks using hashblock zmq event
    zmqChainLockSocket.on('message', (socketChainLockMessage) => {
      const socketChainLock = new ChainLock(socketChainLockMessage);
      logger.info(`Received new chainlock ${socketChainLock.toString()}`);
      latestCoreChainLock.update(socketChainLock);
    });

    return new ResponseInitChain({
      latestCoreChainLock,
    });
  }

  return initChainHandler;
}

module.exports = initChainHandlerFactory;
