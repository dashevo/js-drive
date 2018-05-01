const fs = require('fs');
const path = require('path');

const addStateTransitionPacket = require('../../../lib/storage/addStateTransitionPacket');
const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');

const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

function loadStateTransitionPackets() {
  const packetsJSON = fs.readFileSync(path.join(__dirname, '/../../fixtures/stateTransitionPackets.json'));
  return JSON.parse(packetsJSON);
}

describe('addStateTransitionPacket', () => {
  let ipfsApi;
  before(async () => {
    ipfsApi = await startIPFSInstance();
  });

  let packetsData;
  before(() => {
    packetsData = loadStateTransitionPackets();
  });

  it('should add packets to storage and returns hash', async () => {
    const packets = packetsData.map(packetData => new StateTransitionPacket(packetData));
    const addPacketsPromises = packets.map(addStateTransitionPacket.bind(null, ipfsApi));
    const packetsCids = await Promise.all(addPacketsPromises);

    // 1. Packets should be available in IPFS
    // eslint-disable-next-line arrow-body-style
    const packetsPromisesFromIPFS = packetsCids.map((packetCid) => {
      return ipfsApi.dag.get(packetCid);
    });

    const packetsFromIPFS = await Promise.all(packetsPromisesFromIPFS);

    // 2. Packets should have the same data
    const packetFromIPFS = packetsFromIPFS.map(packet => packet.value);

    expect(packets).to.deep.equal(packetFromIPFS);
  });
});
