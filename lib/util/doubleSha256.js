const crypto = require('crypto');

const Schema = require('@dashevo/dash-schema/dash-schema-lib');

function sha256(payload) {
  return crypto.createHash('sha256')
    .update(payload)
    .digest();
}
/**
 * Serialize and hash payload using double sha256
 *
 * @param payload
 * @return {string}
 */
module.exports = function doubleSha256(payload) {
  const serializedPayload = Schema.serialize.encode(payload);
  return sha256(sha256(serializedPayload)).toString('hex');
};
