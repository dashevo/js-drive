const ZMQClient = require('@dashevo/dashd-zmq');
const waitForEvent = require('../util/waitForEvent');

async function ensureBlock(socketClient, rpcClient, hash) {
  try {
    await rpcClient.getBlock(hash);
  } catch (e) {
    // Block not found
    if (e.code === -5) {
      await waitForEvent(socketClient, ZMQClient.TOPICS.hashblock, hash);
    } else {
      throw e;
    }
  }
}

module.exports = ensureBlock;
