const addSTPacketFactory = require('../../lib/storage/addSTPacketFactory');
const getStateTransitionPackets = require('../../lib/test/fixtures/getTransitionPacketFixtures');

const registerUser = require('../../lib/test/registerUser');
const createDapContractST = require('../../lib/test/createDapContractST');

const startDashDriveInstance = require('../../lib/test/services/dashDrive/startDashDriveInstance');

const wait = require('../../lib/test/util/wait');
const cbor = require('cbor');

/**
 * Await Dash Core instance to finish syncing
 *
 * @param {DashCoreInstance} instance
 * @returns {Promise<void>}
 */
async function dashCoreSyncToFinish(instance) {
  let finished = false;
  while (!finished) {
    const status = await instance.rpcClient.mnsync('status');
    console.log(status);
    if (status.result.IsSynced) {
      finished = true;
    } else {
      await wait(3000);
    }
  }
}

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
  let firstDashDriveInstance;
  let secondDashDriveInstance;

  let packetsCids;

  let createAndSubmitST;

  this.timeout(900000);

  before('having started first Dash Drive node, generated STs and second Dash Drive node replicated data from the first one', async () => {
    packetsCids = [];
    const packetsData = getStateTransitionPackets();

    // 1. Start both full Dash Drive instances
    [firstDashDriveInstance, secondDashDriveInstance] = await startDashDriveInstance.many(2);

    // 2. Populate first instance of Dash Drive and Dash Core with data
    createAndSubmitST = async (username) => {
      // 2.1 Get packet data with random object description
      const packetOne = packetsData[0];
      packetOne.data.objects[0].description = `Valid registration for ${username}`;

      // 2.2 Register user and create DAP Contract State Transition packet and header
      const { userId, privateKeyString } =
        await registerUser(username, firstDashDriveInstance.dashCore.rpcClient);
      const [packet, header] = await createDapContractST(userId, privateKeyString, packetOne);

      // 2.3 Add ST packet to IPFS
      const addSTPacket = addSTPacketFactory(firstDashDriveInstance.ipfs.getApi());
      const packetCid = await addSTPacket(packet);

      // 2.4 Save CID of freshly added packet for future use
      packetsCids.push(packetCid);

      // 2.5 Send ST header to Dash Core and generate a block with it
      await firstDashDriveInstance.dashCore.rpcClient.sendRawTransition(header);
      await firstDashDriveInstance.dashCore.rpcClient.generate(1);
    };

    for (let i = 0; i < 20; i++) {
      await createAndSubmitST(`Alice_${i}`);
    }

    // 3. Await second node of Dash Core and Dash Drive to sync
    await dashCoreSyncToFinish(secondDashDriveInstance.dashCore);
    await dashDriveSyncToFinish(secondDashDriveInstance);
  });

  it('Dash Drive should sync data after blockchain reorganization, removing uncessary data.' +
     'Dash Drive on another node should replicate data from the first one.', async () => {
    // 4. Invalidate half of the generated ST blocks
    await firstDashDriveInstance.dashCore.rpcClient.invalidate(10);

    // 5. Generate one new ST block
    await createAndSubmitST('Bob');

    // 6. Awat Dash Core on 2nd node to sync
    await dashCoreSyncToFinish(secondDashDriveInstance.dashCore);

    // 7. Await both Dash Drive nodes to sync latest changes
    await dashDriveSyncToFinish(firstDashDriveInstance);
    await dashDriveSyncToFinish(secondDashDriveInstance);

    // 8. Check last half of packets have been removed
    //    As half of the blocks (10) have been removed as well
    const lastHalfHashes = packetsCids.splice(10, 20);

    let lsResult = await firstDashDriveInstance.ipfs.getApi().pin.ls();
    const firstNodeHashes = lsResult.map(item => item.hash);

    lsResult = await secondDashDriveInstance.ipfs.getApi().pin.ls();
    const secondNodeHashes = lsResult.map(item => item.hash);

    expect(firstNodeHashes).to.not.contain.members(lastHalfHashes);
    expect(secondNodeHashes).to.not.contain.members(lastHalfHashes);

    expect(firstNodeHashes).to.have.members(secondNodeHashes);
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      firstDashDriveInstance.remove(),
      secondDashDriveInstance.remove(),
    ]);
    await promises;
  });
});
