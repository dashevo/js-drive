const blake2b = require('blake2b');

/**
 * @param {Buffer} data
 * @return {Buffer}
 */
function hashFunction(data) {
  const hashArray = blake2b(32).update(data).digest();

  return Buffer.from(hashArray);
}

module.exports = hashFunction;
