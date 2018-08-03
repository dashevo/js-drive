const { PrivateKey, Transaction } = require('@dashevo/dashcore-lib');

const hashSTPacket = require('./consensus/hashSTPacket');

/**
 * Create DAP contract state transaction packet and header
 *
 * @param {string} regTxId Registration transaction ID (User ID)
 * @param {string} privateKeyString
 * @param {StateTransitionPacket} tsp
 * @returns {Promise<Transaction>}
 */
async function createSTHeader(regTxId, privateKeyString, tsp) {
  const privateKey = new PrivateKey(privateKeyString);

  const stPacketHash = await hashSTPacket(tsp.toJSON({ skipMeta: true }));

  const extraPayload = Transaction.Payload.SubTxTransitionPayload.fromJSON({
    nVersion: 1,
    hashSTPacket: stPacketHash,
    regTxId,
    vchSig: '00',
  });

  extraPayload.sign(privateKey);

  const transaction = new Transaction();

  return transaction.setType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION)
    .setExtraPayload(extraPayload)
    .sign(privateKey);
}

module.exports = createSTHeader;
