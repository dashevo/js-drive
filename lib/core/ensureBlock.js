const OldZMQClient = require('./ZmqClient');

/**
 *
 * @param {OldZMQClient} zmqClient
 * @param {RpcClient} rpcClient
 * @param {string} hash
 * @return {Promise<void>}
 */
async function ensureBlock(zmqClient, rpcClient, hash) {
  const eventPromise = new Promise((resolve) => {
    const onHashBlock = (response) => {
      if (hash === response) {
        zmqClient.removeListener(OldZMQClient.TOPICS.hashblock, onHashBlock);

        resolve(response);
      }
    };

    zmqClient.on(OldZMQClient.TOPICS.hashblock, onHashBlock);
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
