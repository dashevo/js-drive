const addSTPacketFactory = require('../../lib/storage/ipfs/addSTPacketFactory');
const getStateTransitionPackets = require('../../lib/test/fixtures/getTransitionPacketFixtures');

const registerUser = require('../../lib/test/registerUser');
const createDapContractST = require('../../lib/test/createDapContractST');

const startDashDriveInstance = require('../../lib/test/services/dashDrive/startDashDriveInstance');

const wait = require('../../lib/test/util/wait');
const cbor = require('cbor');

/**
 * Await Dash Drive instance to finish syncing
 *
 * @param {DashDriveInstance} instance
 * @returns {Promise<void>}
 */
async function dashDriveSyncToFinish(instance) {
  const packet = getStateTransitionPackets()[0];
  const serializedPacket = cbor.encodeCanonical(packet);
  const serializedPacketJson = {
    packet: serializedPacket.toString('hex'),
  };

  let finished = false;
  while (!finished) {
    try {
      const response = await instance.getApi()
        .request('addSTPacketMethod', serializedPacketJson);
      if (response.result) {
        finished = true;
      } else {
        await wait(1000);
      }
    } catch (e) {
      await wait(1000);
    }
  }
}

describe('Blockchain reorganization', function main() {
  let dashDriveInstance;

  let packetsCids;
  let lastPacketCid;

  let createAndSubmitST;

  this.timeout(900000);

  before('having started Dash Drive node and generated some STs', async () => {
    packetsCids = [];
    const packetsData = getStateTransitionPackets();

    // 1. Start one full Dash Drive instances
    dashDriveInstance = await startDashDriveInstance();

    // 2. Populate instance of Dash Drive and Dash Core with data
    createAndSubmitST = async (username) => {
      // 2.1 Get packet data with random object description
      const packetOne = packetsData[0];
      packetOne.data.objects[0].description = `Valid registration for ${username}`;

      // 2.2 Register user and create DAP Contract State Transition packet and header
      const { userId, privateKeyString } =
        await registerUser(username, dashDriveInstance.dashCore.rpcClient);
      const [packet, header] = await createDapContractST(userId, privateKeyString, packetOne);

      // 2.3 Add ST packet to IPFS
      const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs.getApi());
      const packetCid = await addSTPacket(packet);

      // 2.4 Save CID of freshly added packet for future use
      packetsCids.push(packetCid);

      // 2.5 Send ST header to Dash Core and generate a block with it
      await dashDriveInstance.dashCore.rpcClient.sendRawTransition(header);
      await dashDriveInstance.dashCore.rpcClient.generate(1);
    };

    for (let i = 0; i < 4; i++) {
      await createAndSubmitST(`Alice_${i}`);
    }

    lastPacketCid = packetsCids[packetsCids.length - 1];
  });

  it('Dash Drive should sync data after blockchain reorganization, removing uncessary data.', async () => {
    // 4. Invalidate block that is 6 blocks away from the top
    const { result: blockCount } = await dashDriveInstance.dashCore.rpcClient.getBlockCount();
    const { result: blockHashToInvalidate } = await dashDriveInstance.dashCore.rpcClient
      .getBlockHash(blockCount - 6);

    await dashDriveInstance.dashCore.rpcClient.invalidateBlock(blockHashToInvalidate);

    // 5. Generate two new STs
    await createAndSubmitST('Bob');
    await createAndSubmitST('John');

    // 6. Await Dash Drive to sync latest changes
    await dashDriveSyncToFinish(dashDriveInstance.dashDrive);

    // 7. Check that lastly submitted by createAndSubmitST method ST is gone from IPFS
    const lsResult = await dashDriveInstance.ipfs.getApi().pin.ls();
    const currentCids = lsResult.map(item => item.hash);

    expect(currentCids).to.not.include(lastPacketCid);
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      dashDriveInstance.remove(),
    ]);
    await promises;
  });
});
