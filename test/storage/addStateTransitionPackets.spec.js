const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const addStateTransitionPacket = require('../../lib/storage/addStateTransitionPackets');
const StateTransitionPacket = require('../../lib/storage/StateTransitionPacket');

const startIPFSInstance = require('../helpers/startIPFSInstance');

describe('Storage', () => {
  let ipfs = null;

  startIPFSInstance().then((_ipfs) => {
    ipfs = _ipfs;
  });

  describe('addStateTransitionPackets', () => {
    it('should add packets to storage and returns hash', async () => {
      const packetsJSON = fs.readFileSync(path.join(__dirname, '/../fixtures/stateTransitionPackets.json'));
      const packetsData = JSON.parse(packetsJSON);

      const packets = packetsData.map(packetData => new StateTransitionPacket(packetData));

      const hashes = await addStateTransitionPacket(ipfs, packets);

      expect(hashes).to.be.an('array').that.deep.equal([
        'QmWT8DRxDfUwFWMkpD7YALEvDrHdSEA4xbGbC4cyzosegP',
        'QmQMKS1dGBLhVvWqxsMEwzNs8roB11bPDcmfYGfsq3DDEc',
        'QmQjrizhaqvYmmeUftQonXZS2c5unTyM9D88JgPNrHkQE6',
      ]);
    });
  });
});
