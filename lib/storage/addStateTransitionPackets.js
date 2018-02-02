const cbor = require('cbor');

let ipfs = null;


/**
 * Store ST packet
 *
 * @param {StateTransitionPacket[]} packet ST packet
 * @return string
 */
async function addStateTransitionPacket(packet) {
  const dir = {
    path: `/${packet.meta.id}`,
  };

  // eslint-disable-next-line arrow-body-style
  const files = packet.data.objects.map((object) => {
    return {
      path: `/${packet.meta.id}/${object.meta.id}`,
      content: cbor.encode(object.data),
    };
  });

  const hashes = await ipfs.files.add([dir].concat(files));
  const dirHash = hashes[hashes.length - 1].hash;

  // TODO: compare IPFS hash with packet.meta.id

  await ipfs.pin.add(dirHash, { recursive: true });

  return hashes[0].hash;
}

/**
 * Store State Transition packets
 *
 * Pins/adds ST packets to IPFS storage and returns their hashes
 *
 * @param {IPFSApi} _ipfs IPFS instance
 * @param {StateTransitionPacket[]} packets State Transition packets
 * @return {string[]}
 */
module.exports = async function addStateTransitionPackets(_ipfs, packets) {
  ipfs = _ipfs;
  return Promise.all(packets.map(addStateTransitionPacket));
};
