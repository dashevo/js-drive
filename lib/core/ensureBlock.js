const ZMQClient = require('@dashevo/dashd-zmq');

/**
 *
 * @param {ZMQClient} zmqClient
 * @param {RpcClient} rpcClient
 * @param {string} hash
 * @return {Promise<void>}
 */
async function ensureBlock(zmqClient, rpcClient, hash) {
  // Because a ChainLock may happen before its block, we also subscribe to rawblock
  zmqClient.subscribe(ZMQClient.TOPICS.hashblock);

  const eventPromise = new Promise((resolve) => {
    zmqClient.on(ZMQClient.TOPICS.hashblock, (response) => {
      if (hash === response) {
        zmqClient.removeAllListeners(ZMQClient.TOPICS.hashblock);

        resolve(response);
      }
    });
  });

  try {
    await rpcClient.getBlock(hash);
  } catch (e) {
    // Block not found
    if (e.code === -5) {
      await eventPromise;
    } else {
      throw e;
    }
  }
}

module.exports = ensureBlock;
