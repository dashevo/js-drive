const bs58 = require('bs58');
const crypto = require('crypto');

/**
 * Create DAP Object ID from Blockchain User Id and Slot number (idx)
 *
 * @param blockchainUserId
 * @param slotNumber
 * @returns {string}
 */
function createDapObjectId(blockchainUserId, slotNumber) {
  const hash = crypto.createHash('sha256');
  hash.update(`${blockchainUserId}${slotNumber}`);
  const sha256 = hash.digest('hex');
  return bs58.encode(Buffer.from(sha256, 'hex'));
}

module.exports = createDapObjectId;
