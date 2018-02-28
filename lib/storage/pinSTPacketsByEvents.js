const pinSTPacketByHeader = require('./pinSTPacketByHeader');
const StateTransitionHeader = require('../blockchain/StateTransitionHeader');

/**
 *
 * @param {IpfsAPI} ipfsAPI
 * @param {Socket} zmqSocket
 * @param logger
 * @return {Promise<void>}
 */
module.exports = async function pinSTPacketsByEvents(ipfsAPI, zmqSocket, logger) {
  zmqSocket.on('message', (topic, message) => {
    let stateTransitionHeader;
    try {
      stateTransitionHeader = new StateTransitionHeader(message);
    } catch (e) {
      logger.error(e);
    }
    pinSTPacketByHeader(ipfsAPI, stateTransitionHeader);
  });

  zmqSocket.subscribe('zmqpubrawst');
};
