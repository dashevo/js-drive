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

describe('Initial sync of Dash Drive and Dash Core', function main() {
  // First node
  let dashDriveInstance;

  // Second node
  let dashCoreInstance;
  let mongoDbInstance;
  let dashDriveInstance2;
  let ipfsInstance;

  let packetsCids;

  const packetsData = getStateTransitionPackets();

  this.timeout(900000);

  before('having Dash Drive node #1 up and ready, some amount of STs generated and Dash Drive on node #1 fully synced', async () => {
    dashDriveInstance = await startDashDriveInstance();

    const { userId, privateKeyString } = await generateStateTransitions.registerUser('Alice', dashDriveInstance.dashCore.rpcClient);

    const [packet, header] = await generateStateTransitions.createDapContractTransitions(
      userId, privateKeyString, packetsData[0]
    );

    const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs.getApi());
    const packetCid = await addSTPacket(packet);

    packetsCids = [packetCid];

    await dashDriveInstance.dashCore.rpcClient.sendRawTransition(header);
    await dashDriveInstance.dashCore.rpcClient.generate(7);
  });

  it('Dash Drive should sync the data with Dash Core upon startup', async () => {
    dashCoreInstance = await startDashCoreInstance();
    await dashCoreInstance.connect(dashDriveInstance.dashCore);

    mongoDbInstance = await startMongoDbInstance();

    ipfsInstance = await startIPFSInstance();
    await ipfsInstance.connect(dashDriveInstance.ipfs);

    while(true) {
      const status = await dashCoreInstance.rpcClient.mnsync('status');
      if (status.result.IsSynced === true) {
	break;
      }
      await wait(3000);
    }

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

    const serializedPacket = cbor.encodeCanonical(packetsData[0]);
    const spJson = {
      packet: serializedPacket.toString('hex')
    };

    async function dashDriveSyncToFinish() {
      let finished = false;
      while(!finished) {
	dashDriveInstance2.getApi().request('addSTPacketMethod', spJson, (err, res) => {
	  if (err) {
	    return;
	  }
	  if (res.error && res.error.code === 100) {
	    return;
	  }
	  finished = true;
	});
	await wait(1000);
      }
    }

    await dashDriveSyncToFinish();

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
      ipfsInstance.remove()
    ]);
    await promises;
  });
});
