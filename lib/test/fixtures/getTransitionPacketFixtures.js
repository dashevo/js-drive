const fs = require('fs');

const doubleSha256 = require('../../util/doubleSha256');

const StateTransitionPacket = require('../../storage/StateTransitionPacket');

module.exports = function getTransitionPacketFixtures() {
  const packetsJSON = fs.readFileSync(`${__dirname}/../../../test/fixtures/stateTransitionPackets.json`);
  const transitionPacketPacketData = JSON.parse(packetsJSON.toString());

  let dapId;
  return transitionPacketPacketData.map((packetData) => {
    const updatedPacketData = Object.assign({}, packetData);
    if (dapId) {
      updatedPacketData.dapid = dapId;
    }

    const packet = new StateTransitionPacket(updatedPacketData);

    if (packet) {
      dapId = doubleSha256(packet.dapcontract);
    }

    return packet;
  });
};
