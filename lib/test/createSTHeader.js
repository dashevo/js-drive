const BitcoreLib = require('@dashevo/dashcore-lib');

const { PrivateKey } = BitcoreLib;
const { TransitionHeader } = BitcoreLib.StateTransition;

const hashSTPacket = require('./consensus/hashSTPacket');

/**
 * Create DAP contract state transaction packet and header
 * @param {string} userId
 * @param {string} privateKeyString
 * @param {StateTransitionPacket} tsp
 * @param {string} prevTransitionHash
 * @returns {TransitionHeader}
 */
async function createSTHeader(userId, privateKeyString, tsp, prevTransitionHash = undefined) {
  const privateKey = new PrivateKey(privateKeyString);

  const STPacketHash = await hashSTPacket(tsp.toJSON({ skipMeta: true }));

  const header = new TransitionHeader()
    .setHashSTPacket(STPacketHash)
    .setRegTxHash(userId);

  if (prevTransitionHash) {
    header.setPrevTransitionHash(prevTransitionHash);
  }

  return header.sign(privateKey)
    .serialize();
}

module.exports = createSTHeader;
