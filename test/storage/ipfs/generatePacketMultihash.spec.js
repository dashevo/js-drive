const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const addStateTransitionPacket = require('../../../lib/storage/addStateTransitionPacket');
const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');
const generatePacketMultihash = require('../../../lib/storage/ipfs/generatePacketMultihash');

const startIPFSInstance = require('../../../lib/test/startIPFSInstance');

describe('Storage', () => {
  describe('IPFS', () => {
    describe('addStateTransitionPacket', () => {
      let ipfsApi;

      startIPFSInstance().then((_ipfsApi) => {
        ipfsApi = _ipfsApi;
      });

      it('should add packets to storage and returns hash', async () => {
        const packetsJSON = fs.readFileSync(path.join(__dirname, '/../../fixtures/stateTransitionPackets.json'));
        const packetsData = JSON.parse(packetsJSON);

        const packets = packetsData.map(packetData => new StateTransitionPacket(packetData));

        const addPacketPromises = packets.map(addStateTransitionPacket.bind(null, ipfsApi));

        const packetMultihashesFromIPFS = await Promise.all(addPacketPromises);

        const generateMultihashesPromises = packets.map(generatePacketMultihash);

        const packetMultihashes = await Promise.all(generateMultihashesPromises);

        expect(packetMultihashes).to.be.deep.equal(packetMultihashesFromIPFS);
      });
    });
  });
});
