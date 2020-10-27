const ZMQClient = require('@dashevo/dashd-zmq');

/**
 *
 * @param {EventEmitter} socketClient
 * @param {RpcClient} rpcClient
 * @param {string} hash
 * @return {Promise<void>}
 */
async function ensureBlock(socketClient, rpcClient, hash) {
  const eventPromise = new Promise((resolve) => {
    socketClient.on(ZMQClient.TOPICS.hashblock, (response) => {
      if (hash === undefined || hash === response) {
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
