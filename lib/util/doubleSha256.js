const cbor = require('cbor');
const crypto = require('crypto');

function sha256(payload) {
  return crypto.createHash('sha256')
    .update(payload)
    .digest('hex');
}

module.exports = function doubleSha256(payload) {
  const serializedPayload = cbor.encodeCanonical(payload);
  return sha256(sha256(serializedPayload));
};
