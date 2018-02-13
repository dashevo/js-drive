const packetToIPFSFiles = require('../consensus/packetToIPFSfiles');

/**
 * Store State Transition packet
 *
 * Pins/adds ST packet to IPFS storage and returns their hash
 *
 * @param {IPFSApi} ipfs IPFS instance
 * @param {StateTransitionPacket[]} packet State Transition packets
 * @return {string[]}
 */
module.exports = async function addStateTransitionPacket(ipfs, packet) {
  const files = packetToIPFSFiles(packet);

  const hashes = await ipfs.files.add(files);
  const dirHash = hashes[hashes.length - 1].hash;

  await ipfs.pin.add(dirHash, { recursive: true });

  return dirHash;
};
