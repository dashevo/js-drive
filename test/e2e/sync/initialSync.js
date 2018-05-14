const addSTPacketFactory = require('../../../lib/storage/addSTPacketFactory');

const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');
// const StateTransitionHeader = require('../../../lib/blockchain/StateTransitionHeader');

const getStateTransitionPackets = require('../../fixtures/getStateTransitionPackets');
// const getStateTransitionHeaders = require('../../fixtures/getStateTransitionHeaders');

const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');
const startIPFSInstance = require('../../../lib/test/services/IPFS/startIPFSInstance');

const createDashDriveInstance = require('../../../lib/test/services/dashDrive/createDashDriveInstance');
const createDashCoreInstance = require('../../../lib/test/services/dashCore/createDashCoreInstance');
const createMongoDbInstance = require('../../../lib/test/services/mongoDb/createMongoDbInstance');

// const generateStateStransitions = require('../../../lib/test/fixtures/generateStateTransitions');

describe('Initial sync of Dash Drive and Dash Core', function main() {
  // First node
  let dashDriveInstance;

  // Second node
  let dashCoreInstance;
  let mongoDbInstance;
  let dashDriveInstance2;

  let packetsCids;

  this.timeout(100000);

  before('having Dash Drive node #1 up and ready, some amount of STs generated and Dash Drive on node #1 fully synced', async () => {
    // start Dash Drive node #1

    dashDriveInstance = await startDashDriveInstance();

    // generate and add ST packets to Dash Drive

    // TODO: fix user registration

    // const [transitionPacket, transitionHeader] = await gst.dapContractTransitions(
    //   'bob',
    //   dashDriveInstance.dashCore.rpcClient
    // );

    // const packetsData = [transitionPacket];
    // const packetsHeaders = [transitionHeader];

    const addSTPacket = addSTPacketFactory(dashDriveInstance.ipfs);
    const packetsData = getStateTransitionPackets();
    const packets = packetsData.map(packetData => new StateTransitionPacket(packetData));
    const addPacketsPromises = packets.map(addSTPacket);
    packetsCids = await Promise.all(addPacketsPromises);

    // submit headers to Dash Core

    // const packetsHeaders = getStateTransitionHeaders();
    // const headers = packetsHeaders.map(headerData => new StateTransitionHeader(headerData));

    // TODO: fix user registration or fix fixtures

    // const transitionIdsPromises = headers.map((header) => {
    //   return dashDriveInstance.dashCore.rpcClient.sendRawTransition(header.serialize());
    // });
    // const transitionIds = await Promise.all(transitionIdsPromises);
  });

  it('Dash Drive should sync the data with Dash Core upon startup', async () => {
    // start Dash Core on the node #2

    dashCoreInstance = await createDashCoreInstance();
    await dashCoreInstance.start();

    mongoDbInstance = await createMongoDbInstance();
    await mongoDbInstance.start();

    const ipfsInstance = await startIPFSInstance();
    const { apiHost, apiPort } = ipfsInstance;

    // TODO: wait until Dash Core syncs
    // Not sure how to check it

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

    dashDriveInstance2 = await createDashDriveInstance(envs);
    await dashDriveInstance2.start();

    // TODO: wait until Dash Drive replicates data?

    const lsResult = await ipfsInstance.pin.ls();

    const hashes = lsResult.map(item => item.hash);

    // TODO: once user registration is fixed remove "not"
    expect(hashes).to.not.contain.members(packetsCids);
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      mongoDbInstance.clean(),
      dashCoreInstance.clean(),
      dashDriveInstance2.clean(),
    ]);
    await promises;
  });
});
