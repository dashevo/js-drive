const pinSTPacketByHeader = require('./pinSTPacketByHeader');
const StateTransitionHeader = require('../blockchain/StateTransitionHeader');

/**
 *
 * @param {IpfsAPI} ipfsAPI
 * @param {Socket} zmqSocket
 * @return {Promise<void>}
 */
module.exports = async function pinSTPacketsByEvents(ipfsAPI, zmqSocket) {
  zmqSocket.on('message', async (topic, message) => {
    await pinSTPacketByHeader(ipfsAPI, new StateTransitionHeader(message));
  });
  zmqSocket.subscribe('zmqpubrawst');
};
