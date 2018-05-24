const addSTPacketFactory = require('../../../lib/storage/addSTPacketFactory');

const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');

const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');

const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');
const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

const createDashDriveInstance = require('../../../lib/test/services/dashDrive/createDashDriveInstance');
const createDashCoreInstance = require('../../../lib/test/services/dashCore/createDashCoreInstance');
const createMongoDbInstance = require('../../../lib/test/services/mongoDb/createMongoDbInstance');

const gst = require('../../../lib/test/fixtures/generateStateTransitions');

const jayson = require('jayson');

const cbor = require('cbor');

describe('Sync interruption and resume between Dash Drive and Dash Core', function main() {
  // First node
  let dashDriveInstance;

  // Second node
  let dashCoreInstance;
  let mongoDbInstance;
  let dashDriveInstance2;

  let packetsCids = [];

  let packetsData;

  this.timeout(300000);

  before('having Dash Drive node #1 up and running', async () => {
    dashDriveInstance = await startDashDriveInstance();

    packetsData = getStateTransitionPackets();

    async function createAndSubmitST(username) {
      const { userId, privateKeyString } = await gst.registerUser(
	username, dashDriveInstance.dashCore.rpcClient
      );

      const [packet, header] = await gst.createDapContractTransitions(
	userId, privateKeyString, packetsData[0]
      );

      const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs);
      const packetCid = await addSTPacket(packet);

      packetsCids.push(packetCid);

      const txid = await dashDriveInstance.dashCore.rpcClient.sendRawTransition(header);

      return txid;
    }

    for(let i = 0; i < 50; i++) {
      const txid = await createAndSubmitST(`Alice_${i}`);
    }

    const txids = await dashDriveInstance.dashCore.rpcClient.generate(60);
  });

  it('Dash Drive should save sync state and continue from saved point after resume', async () => {
    dashCoreInstance = await createDashCoreInstance();
    await dashCoreInstance.start();

    await dashCoreInstance.connect(dashDriveInstance.dashCore);

    mongoDbInstance = await createMongoDbInstance();
    await mongoDbInstance.start();

    const ipfsInstance = await startIPFSInstance();
    const { apiHost, apiPort } = ipfsInstance;

    const firstInstanceId = await dashDriveInstance.ipfs.id();

    await ipfsInstance.swarm.connect(
      firstInstanceId.addresses[0]
    );

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    while(true) {
      const status = await dashCoreInstance.rpcClient.mnsync('status');
      if (status.result.IsSynced === true) {
	break;
      }
      await wait(3000);
    }

    // start Dash Drive on node #2
    const envs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCoreInstance.options.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `STORAGE_IPFS_MULTIADDR=/ip4/${apiHost}/tcp/${apiPort}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}`,
    ];

    let lsResult = await ipfsInstance.pin.ls();
    const initialHashes = lsResult.map(item => item.hash);

    dashDriveInstance2 = await createDashDriveInstance(envs);
    await dashDriveInstance2.start();

    const ddPort = await dashDriveInstance2.getRpcPort();

    // Shamelesly taken from David
    async function createRpcClient(rpcPort) {
      const client = jayson.client.http({
	host: '0.0.0.0',
	port: rpcPort,
      });

      return new Promise((resolve) => {
	function request() {
          client.request('', [], (error) => {
            if (error && error.message === 'socket hang up') {
              return setTimeout(request, 1000);
            }
            return resolve(client);
          });
	}
	request();
      });
    }

    const driveRpc = await createRpcClient(ddPort);

    const simplePacket = {
      packet: cbor.encodeCanonical(packetsData[0])
    };

    async function dashDriveSyncToFinish() {
      let finished = false;
      while(!finished) {
	driveRpc.request('addSTPacketMethod', simplePacket, (err, res) => {
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

    // TODO: figure out a proper timeout once error with RPC resolved.
    // Or count pinned hashes and continue once there are 10 of them, for example.
    for (let i = 0; i < 5; i++) {
      await wait(1000);
    }

    await dashDriveInstance2.stop();

    lsResult = await ipfsInstance.pin.ls();
    const pinnedHashes = lsResult
	  .filter(item => initialHashes.indexOf(item.hash) === -1)
	  .map(item => item.hash);

    const rmPromises = Promise.all(
      pinnedHashes.map(hash => ipfsInstance.pin.rm(hash))
    );
    await rmPromises;

    await dashDriveInstance2.start();

    await dashDriveSyncToFinish();

    lsResult = await ipfsInstance.pin.ls();

    const hashesAfterResume = lsResult.map(item => item.hash);

    expect(hashesAfterResume).to.not.contain.members(pinnedHashes);
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      mongoDbInstance.remove(),
      dashCoreInstance.remove(),
      dashDriveInstance.remove(),
      dashDriveInstance2.remove(),
    ]);
    await promises;
  });
});
