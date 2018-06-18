const addSTPacketFactory = require('../../../lib/storage/addSTPacketFactory');
const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');
const generateStateTransitions = require('../../../lib/test/fixtures/generateStateTransitions');

const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');
const startDashCoreInstance = require('../../../lib/test/services/dashCore/startDashCoreInstance');
const startMongoDbInstance = require('../../../lib/test/services/mongoDb/startMongoDbInstance');
const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

const createDashDriveInstance = require('../../../lib/test/services/dashDrive/createDashDriveInstance');

const wait = require('../../../lib/test/util/wait');
const cbor = require('cbor');

describe('Sync interruption and resume between Dash Drive and Dash Core', function main() {
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

  before('having Dash Drive node #1 up and running', async () => {
    dashDriveInstance = await startDashDriveInstance();

    packetsCids = [];
    packetsData = getStateTransitionPackets();

    async function createAndSubmitST(username) {
      const packetOne = packetsData[0];
      packetOne.data.objects[0].description = `Valid registration for ${username}`;

      const { userId, privateKeyString } = await generateStateTransitions
        .registerUser(username, dashDriveInstance.dashCore.rpcClient);
      const [packet, header] = await generateStateTransitions
        .createDapContractTransitions(userId, privateKeyString, packetOne);

      const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs.getApi());
      const packetCid = await addSTPacket(packet);

      packetsCids.push(packetCid);

      await dashDriveInstance.dashCore.rpcClient.sendRawTransition(header);
      await dashDriveInstance.dashCore.rpcClient.generate(1);
    }

    for (let i = 0; i < 50; i++) {
      await createAndSubmitST(`Alice_${i}`);
    }
  });

  it('Dash Drive should save sync state and continue from saved point after resume', async () => {
    dashCoreInstance = await startDashCoreInstance();
    await dashCoreInstance.connect(dashDriveInstance.dashCore);

    mongoDbInstance = await startMongoDbInstance();

    ipfsInstance = await startIPFSInstance();
    await ipfsInstance.connect(dashDriveInstance.ipfs);

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

    let lsResult = await ipfsInstance.getApi().pin.ls();
    const initialHashes = lsResult.map(item => item.hash);

    dashDriveInstance2 = await createDashDriveInstance(envs);
    await dashDriveInstance2.start();

    const serializedPacket = cbor.encodeCanonical(packetsData[0]);
    const spJson = {
      packet: serializedPacket.toString('hex'),
    };

    async function dashDriveSyncToFinish(instance) {
      let finished = false;
      while (!finished) {
        try {
          const response = await instance.getApi().request('addSTPacketMethod', spJson);
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

    // Wait a couple of seconds to sync a few packets
    for (let i = 0; i < 5; i++) {
      await wait(1000);
    }

    await dashDriveInstance2.stop();

    lsResult = await ipfsInstance.getApi().pin.ls();
    const pinnedHashes = lsResult
      .filter(item => initialHashes.indexOf(item.hash) === -1)
      .map(item => item.hash);

    const rmPromises = Promise
      .all(pinnedHashes.map(hash => ipfsInstance.getApi().pin.rm(hash)));
    await rmPromises;

    await dashDriveInstance2.start();

    await dashDriveSyncToFinish(dashDriveInstance2);

    lsResult = await ipfsInstance.getApi().pin.ls();

    const hashesAfterResume = lsResult.map(item => item.hash);

    expect(hashesAfterResume).to.not.contain.members(pinnedHashes);
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
