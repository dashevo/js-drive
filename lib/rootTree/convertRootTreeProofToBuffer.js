const BufferWriter = require('@dashevo/dashcore-lib/lib/encoding/bufferwriter');
const { convertBitArrayToUInt8Array } = require('@dashevo/dashcore-lib/lib/util/bitarray');

function convertRootTreeProofToBuffer(rootTreeProof) {
  // amount of subtrees to proof
  const totalObjects = 1;

  const bufferWriter = new BufferWriter();

  bufferWriter.writeUInt32LE(totalObjects);
  bufferWriter.writeVarintNum(rootTreeProof.length);

  rootTreeProof.forEach(({ data: hash }) => {
    bufferWriter.write(hash);
  });

  // boolean array, where left position = false, right position = true
  const merkleFlagsArray = convertBitArrayToUInt8Array(
    rootTreeProof.map(({ position }) => position === 'right'),
  );

  bufferWriter.writeVarintNum(merkleFlagsArray.length);
  merkleFlagsArray.forEach((flag) => {
    bufferWriter.writeUInt8(flag);
  });

  return bufferWriter.toBuffer();
}

module.exports = convertRootTreeProofToBuffer;
