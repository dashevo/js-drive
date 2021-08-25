/**
 *
 * @param {Buffer} proofBuffer
 *
 * @returns {Buffer[]}
 */
function parseProof(proofBuffer) {
  const numberOfHashes = proofBuffer.readUInt8(0);

  const hashes = [];
  for (let i = 0; i < numberOfHashes; i++) {
    const hashArray = [];
    for (let k = 0; k < 32; k++) {
      hashArray.push(proofBuffer.readUInt8(i * 32 + k));
    }
    hashes.push(Buffer.from(hashArray));
  }

  return hashes;
}

module.exports = parseProof;
