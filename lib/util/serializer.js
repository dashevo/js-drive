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
 * @return {Object}
 */
function deserialize(encodedData) {
  return cbor.decode(encodedData);
}

module.exports = {
  serialize,
  deserialize,
};
