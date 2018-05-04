const fs = require('fs');
const path = require('path');
const util = require('util');
const cbor = require('cbor');
const multihashingAsync = require('multihashing-async');
const multihashes = require('multihashes');
const StateTransitionHeader = require('../../../lib/blockchain/StateTransitionHeader');
const addStateTransitionPacket = require('../../../lib/storage/addStateTransitionPacket');
const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

const multihashing = util.promisify(multihashingAsync);

function loadStateTransitionPackets() {
  const packetsJSON = fs.readFileSync(path.join(__dirname, '/../../fixtures/stateTransitionPackets.json'));
  return JSON.parse(packetsJSON);
}

function loadStateTransitionHeaders() {
  const headersJSON = fs.readFileSync(path.join(__dirname, '/../../fixtures/stateTransitionHeaders.json'));
  return JSON.parse(headersJSON);
}

async function hashDataMerkleRoot(packet) {
  const serializedPacket = cbor.encodeCanonical(packet);
  const multihash = await multihashing(serializedPacket, 'sha2-256');
  const decoded = multihashes.decode(multihash);
  return decoded.digest.toString('hex');
}

describe('StateTransitionHeader', () => {
  const packets = loadStateTransitionPackets();
  const packet = packets[0];

  const headers = loadStateTransitionHeaders();
  const header = headers[0];

  let ipfsApi;
  before(async () => {
    ipfsApi = await startIPFSInstance();
  });

  it('should StateTransitionHeader CID equal to IPFS CID', async () => {
    header.hashDataMerkleRoot = await hashDataMerkleRoot(packet);
    const stHeader = new StateTransitionHeader(header);

    const stHeaderCid = stHeader.getPacketCID();
    const ipfsCid = await addStateTransitionPacket(ipfsApi, packet);

    expect(stHeaderCid).to.equal(ipfsCid);
  });
});
