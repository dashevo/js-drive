const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');

/**
 *
 * @param {Buffer[]} rootTreeProof
 *
 * @return {Buffer}
 */
function convertRootTreeProofToBuffer(rootTreeProof) {
  const bufferWriter = new BufferWriter();

  bufferWriter.writeUInt8(rootTreeProof.length);

  rootTreeProof.forEach((hash) => {
    bufferWriter.write(Buffer.from(hash));
  });

  return bufferWriter.toBuffer();
}

module.exports = convertRootTreeProofToBuffer;
