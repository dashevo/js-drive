const { ChainLock } = require('@dashevo/dashcore-lib');

const ZMQClient = require('@dashevo/dashd-zmq');

/**
 *
 * @param {ZMQClient} coreZMQClient
 * @param {RpcClient} coreRpcClient
 * @param {LatestCoreChainLock} latestCoreChainLock
 * @param {BaseLogger} logger
 * @param {function} errorHandler,
 *
 * @returns {fallbackChainLockSync}
 */
function fallbackChainLockSyncFactory(
  coreZMQClient,
  coreRpcClient,
  latestCoreChainLock,
  logger,
  errorHandler,
) {
  /**
   * @typedef fallbackChainLockSync
   *
   * @return {Promise<void>}
   */
  async function fallbackChainLockSync() {
    const signature = Buffer.alloc(32);

    await coreZMQClient.connect();

    // By default will try to reconnect so we just log when this happen
    coreZMQClient.on('disconnect', logger.trace);

    // When socket monitoring ends
    coreZMQClient.on('end', (caughtError) => {
      const error = new Error(`Can't continue without chainLock: ${caughtError.message}`);

      errorHandler(error);
    });

    coreZMQClient.subscribe(ZMQClient.TOPICS.hashblock);

    logger.info('Subscribe to hashblock ZMQ room');

    let resolveFirstBlockFromZMQPromise;
    const firstBlockFromZMQPromise = new Promise((resolve) => {
      resolveFirstBlockFromZMQPromise = resolve;
    });

    coreZMQClient.on(ZMQClient.TOPICS.hashblock, async (blockHash) => {
      const { result: block } = await coreRpcClient.getBlock(blockHash);
      const socketChainLock = new ChainLock({
        height: block.height,
        blockHash,
        signature,
      });

      latestCoreChainLock.update(socketChainLock);

      if (resolveFirstBlockFromZMQPromise) {
        resolveFirstBlockFromZMQPromise();
        resolveFirstBlockFromZMQPromise = null;
      }
    });

    const { result: rpcBestBlockHash } = await coreRpcClient.getBestBlockHash();
    const { result: rpcBestBlock } = await coreRpcClient.getBlock(rpcBestBlockHash);

    if (rpcBestBlock.height > 0) {
      const chainLock = new ChainLock({
        height: rpcBestBlock.height,
        blockHash: rpcBestBlockHash,
        signature,
      });

      latestCoreChainLock.update(chainLock);
    } else {
      // We need to wait for a new block from ZMQ socket
      logger.debug('There is no blocks currently. Waiting for a first one...');

      await firstBlockFromZMQPromise;
    }
  }

  return fallbackChainLockSync;
}

module.exports = fallbackChainLockSyncFactory;
