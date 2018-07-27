const { PrivateKey, Transaction } = require('@dashevo/dashcore-lib');

const hashSTPacket = require('./consensus/hashSTPacket');

/**
 * Create DAP contract state transaction packet and header
 * @param {string} userId
 * @param {string} privateKeyString
 * @param {StateTransitionPacket} tsp
 * @returns {Transaction}
 */
async function createSTHeader(userId, privateKeyString, tsp) {
  const privateKey = new PrivateKey(privateKeyString);

  const STPacketHash = await hashSTPacket(tsp.toJSON({ skipMeta: true }));

  // TODO Use constant
  const header = new Transaction()
    .setSpecialTransactionType(12);

  header.extraPayload.setHashSTPacket(STPacketHash)
    .setRegTxId(userId)
    .sign(privateKey);

  return header.sign(privateKey).serialize();
}

module.exports = createSTHeader;
