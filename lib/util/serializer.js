const cbor = require('cbor');

/**
 * Serialize object
 *
 * @param {Object} data
 * @return {Buffer}
 */
function serialize(data) {
  return cbor.encode(data);
}

/**
 * Deserialize a Buffer into an object
 *
 * @param {Buffer} encodedData
 * @return {Promise<Object>}
 */
async function deserialize(encodedData) {
  return cbor.decodeFirst(encodedData);
}

module.exports = {
  serialize,
  deserialize,
};
