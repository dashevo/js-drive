const ZMQClient = require('@dashevo/dashd-zmq');

const waitForEvent = require('../util/waitForEvent');

async function ensureBlock(socketClient, rpcClient, hash) {
  const eventPromise = waitForEvent(socketClient, ZMQClient.TOPICS.hashblock, hash);

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
