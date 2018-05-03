const cbor = require('cbor');

const createPacketDagNode = require('./ipfs/createPacketDagNode');

/**
 * @param {IpfsAPI} ipfsApi
 * @return {addSTPacket}
 */
module.exports = function addSTPacketFactory(ipfsApi) {
  /**
   * Store State Transition packet in IPFS
   *
   * Stores and pins ST packet to IPFS storage and returns its hash
   *
   * @typedef addSTPacket
   * @param {StateTransitionPacket} packet State Transition packet
   * @return {Promise<string>}
   */
  async function addSTPacket(packet) {
    // Store ST objects in separate IPFS blocks
    const packetData = Object.assign({}, packet.data);
    const { objects } = packetData;
    delete packetData.objects;

    const ipfsBlockPromises = objects.map((object) => {
      const serializedData = cbor.encode(object.data);
      return ipfsApi.block.put(serializedData);
    });

    const ipfsBlocksWithObjects = await Promise.all(ipfsBlockPromises);

    // Store ST packet as DAG node with links to blocks with ST objects
    const packetDagNode = await createPacketDagNode(
      packetData,
      ipfsBlocksWithObjects.map(block => block.cid.toBaseEncodedString()),
    );

    await ipfsApi.object.put(packetDagNode);

    return packetDagNode.toJSON().multihash;
  }

  return addSTPacket;
};
