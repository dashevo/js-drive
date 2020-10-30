const blake2b = require('blake2b');

function hashFunction(data) {
  const output = new Uint8Array(64);

  return blake2b(output.length).update(data).digest();
}

module.exports = hashFunction;
