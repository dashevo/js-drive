const addSTPacketFactory = require('../../../lib/storage/addSTPacketFactory');
const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');

const registerUser = require('../../../lib/test/registerUser');
const createDapContractST = require('../../../lib/test/createDapContractST');

const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');
const startDashCoreInstance = require('../../../lib/test/services/dashCore/startDashCoreInstance');
const startMongoDbInstance = require('../../../lib/test/services/mongoDb/startMongoDbInstance');
const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

const createDashDriveInstance = require('../../../lib/test/services/dashDrive/createDashDriveInstance');

const wait = require('../../../lib/test/util/wait');
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

describe('Initial sync of Dash Drive and Dash Core', function main() {
  // First node
  let dashDriveInstance;

  // Second node
  let dashCoreInstance;
  let mongoDbInstance;
  let dashDriveInstance2;
  let ipfsInstance;

  let packetsCids;
  let packetsData;

  this.timeout(900000);

  before('having Dash Drive node #1 up and ready, some amount of STs generated and Dash Drive on node #1 fully synced', async () => {
    packetsCids = [];
    packetsData = getStateTransitionPackets();

    dashDriveInstance = await startDashDriveInstance();

    async function createAndSubmitST(username) {
      const packetOne = packetsData[0];
      packetOne.data.objects[0].description = `Valid registration for ${username}`;

      const { userId, privateKeyString } =
        await registerUser(username, dashDriveInstance.dashCore.rpcClient);
      const [packet, header] = await createDapContractST(userId, privateKeyString, packetOne);

      const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs.getApi());
      const packetCid = await addSTPacket(packet);

      packetsCids.push(packetCid);

      await dashDriveInstance.dashCore.rpcClient.sendRawTransition(header);
      await dashDriveInstance.dashCore.rpcClient.generate(1);
    }

    for (let i = 0; i < 20; i++) {
      await createAndSubmitST(`Alice_${i}`);
    }
  });

  it('Dash Drive should sync the data with Dash Core upon startup', async () => {
    dashCoreInstance = await startDashCoreInstance();
    await dashCoreInstance.connect(dashDriveInstance.dashCore);

    mongoDbInstance = await startMongoDbInstance();

    ipfsInstance = await startIPFSInstance();
    await ipfsInstance.connect(dashDriveInstance.ipfs);

    await dashCoreSyncToFinish(dashCoreInstance);

    // start Dash Drive on node #2
    const envs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCoreInstance.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `STORAGE_IPFS_MULTIADDR=${ipfsInstance.getIpfsAddress()}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}`,
    ];

    dashDriveInstance2 = await createDashDriveInstance(envs);
    await dashDriveInstance2.start();

    await dashDriveSyncToFinish(dashDriveInstance2);

    const lsResult = await ipfsInstance.getApi().pin.ls();

    const hashes = lsResult.map(item => item.hash);

    expect(hashes).to.contain.members(packetsCids);
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      mongoDbInstance.remove(),
      dashCoreInstance.remove(),
      dashDriveInstance.remove(),
      dashDriveInstance2.remove(),
      ipfsInstance.remove(),
    ]);
    await promises;
  });
});
