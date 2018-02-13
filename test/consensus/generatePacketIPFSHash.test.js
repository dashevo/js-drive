const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const generatePacketIPFSHash = require('../../lib/consensus/generatePacketIPFSHash');

const addStateTransitionPacket = require('../../lib/storage/addStateTransitionPacket');
const StateTransitionPacket = require('../../lib/storage/StateTransitionPacket');

const startIPFSInstance = require('../helpers/startIPFSInstance');

describe('Storage', () => {
  let ipfs = null;

  startIPFSInstance().then((_ipfs) => {
    ipfs = _ipfs;
  });

  describe('generatePacketIPFSHash', () => {
    it('should generate the same hash as IPFS', async () => {
      const packetsJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/stateTransitionPackets.json'));
      const packetsData = JSON.parse(packetsJSON);
      const packets = packetsData.map(packetData => new StateTransitionPacket(packetData));

      const generatedHashes = await Promise.all(packets.map(generatePacketIPFSHash));
      const hashesFromIPFSPromise = packets.map(addStateTransitionPacket.bind(null, ipfs));
      const hashesFromIPFS = await Promise.all(hashesFromIPFSPromise);

      expect(generatedHashes).to.be.an('array').that.deep.equal(hashesFromIPFS);
    });
  });
});
