const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');

const addSTPacketFactory = require('../../../lib/storage/ipfs/addSTPacketFactory');
const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');
const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');

const registerUser = require('../../../lib/test/registerUser');
const createSTHeader = require('../../../lib/test/createSTHeader');

const wait = require('../../../lib/test/util/wait');

async function createAndSubmitST(
  userId,
  privateKeyString,
  username,
  basePacketData,
  instance,
  previousTransitionHash = undefined,
) {
  const packet = new StateTransitionPacket(basePacketData);

  const header = await createSTHeader(userId, privateKeyString, packet, previousTransitionHash);

  const addSTPacket = addSTPacketFactory(instance.ipfs.getApi());
  const packetCid = await addSTPacket(packet);

  const { result: tsId } = await instance.dashCore.rpcClient.sendRawTransition(header);
  await instance.dashCore.rpcClient.generate(1);

  return { packetCid, tsId };
}

async function blockCountEvenAndEqual(
  instanceOne,
  instanceTwo,
  desiredBlockCount = -1,
  timeout = 90,
) {
  for (let i = 0; i < timeout; i++) {
    const { result: blockCountOne } = await instanceOne.rpcClient.getBlockCount();
    const { result: blockCountTwo } = await instanceTwo.rpcClient.getBlockCount();

    if (blockCountOne === blockCountTwo) {
      if (desiredBlockCount !== -1) {
        if (blockCountOne === desiredBlockCount) {
          break;
        } else {
          throw new Error(`Block count of ${blockCountOne} is not desirable ${desiredBlockCount}`);
        }
      }
      break;
    } else if (i === timeout - 1) {
      throw new Error('Timeout waiting for block count to be equal on both nodes');
    }

    await wait(1000);
  }
}

async function ensureDriveHaveCIDs(instance, cids) {
  for (let i = 0; i < 120; i++) {
    const lsResult = await instance.ipfs.getApi().pin.ls();
    const lsHashes = lsResult.map(item => item.hash);

    const haveAll = cids.reduce((acc, next) => acc && (lsHashes.indexOf(next) !== -1), true);

    if (haveAll) {
      break;
    }

    await wait(1000);
  }
}

describe('update', function main() {
  this.timeout(400000);

  let firstInstance;
  let secondInstance;

  let aliceUser;

  let stPackets;

  let dapId;
  let prevTransitionId;

  let packetsCids;

  before('setup nodes, users and initial state view', async () => {
    stPackets = getStateTransitionPackets();
    packetsCids = [];

    // Start two Dash Drive nodes
    [firstInstance, secondInstance] = await startDashDriveInstance.many(2);

    // Wait for Dash Drive nodes to start
    await wait(40000);

    // Register a single user on a blockchain
    aliceUser = {
      username: 'Alice',
    };
    ({ userId: aliceUser.userId, privateKeyString: aliceUser.privateKeyString } =
      await registerUser(aliceUser.username, firstInstance.dashCore.rpcClient));

    // Ensure both Dash Core nodes have the same amount of blocks
    await blockCountEvenAndEqual(firstInstance.dashCore, secondInstance.dashCore);

    // Create DAP Contract
    let packetCid;
    ({ packetCid, tsId: dapId } = await createAndSubmitST(
      aliceUser.userId,
      aliceUser.privateKeyString,
      aliceUser.username,
      stPackets[0],
      firstInstance,
    ));

    packetsCids.push(packetCid);

    // Ensure both Dash Core nodes have the same amount of blocks
    await blockCountEvenAndEqual(firstInstance.dashCore, secondInstance.dashCore);

    // Create and send a basic `user` DAP Object
    const aliceAboutMe = 'Here is something about Alice';
    const userData = Object.assign(stPackets[1], {
      dapid: dapId,
      dapobjects: [
        {
          objtype: 'user',
          aboutme: aliceAboutMe,
          pver: 1,
          idx: 0,
          rev: 1,
          act: 1,
        },
      ],
    });

    ({ packetCid, tsId: prevTransitionId } = await createAndSubmitST(
      aliceUser.userId,
      aliceUser.privateKeyString,
      aliceUser.username,
      userData,
      firstInstance,
      dapId,
    ));

    packetsCids.push(packetCid);

    // Ensure both Dash Core nodes have the same amount of blocks
    await blockCountEvenAndEqual(firstInstance.dashCore, secondInstance.dashCore);

    // Ensure both nodes have necessary CIDs
    await ensureDriveHaveCIDs(firstInstance, packetsCids);
    await ensureDriveHaveCIDs(secondInstance, packetsCids);

    // Ensure first Dash Drive have a proper data
    {
      const { result: objects } = await firstInstance.dashDrive.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      expect(objects.length).to.be.equal(1);
      expect(objects[0].object.aboutme).to.be.equal(aliceAboutMe);
    }

    // Ensure second Dash Drive have a proper data
    {
      const { result: objects } = await secondInstance.dashDrive.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      expect(objects.length).to.be.equal(1);
      expect(objects[0].object.aboutme).to.be.equal(aliceAboutMe);
    }
  });

  it('should update state view upon submitting new ST packet', async () => {
    // Construct and send an update `user` DAP Object
    const newAliceAboutMe = 'Anything else about Alice';
    const userData = Object.assign(stPackets[1], {
      dapid: dapId,
      dapobjects: [
        {
          objtype: 'user',
          aboutme: newAliceAboutMe,
          pver: 1,
          idx: 0,
          rev: 1,
          act: 1,
        },
      ],
    });

    const { packetCid } = await createAndSubmitST(
      aliceUser.userId,
      aliceUser.privateKeyString,
      aliceUser.username,
      userData,
      firstInstance,
      prevTransitionId,
    );

    packetsCids.push(packetCid);

    // Ensure both Dash Core nodes have the same amount of blocks
    await blockCountEvenAndEqual(firstInstance.dashCore, secondInstance.dashCore);

    // Ensure both nodes have necessary CIDs
    await ensureDriveHaveCIDs(firstInstance, packetsCids);
    await ensureDriveHaveCIDs(secondInstance, packetsCids);

    // Ensure first Dash Drive have a proper updated data
    {
      const { result: objects } = await firstInstance.dashDrive.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      expect(objects.length).to.be.equal(1);
      expect(objects[0].object.aboutme).to.be.equal(newAliceAboutMe);
    }

    // Ensure second Dash Drive have a proper updated data
    {
      const { result: objects } = await secondInstance.dashDrive.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      expect(objects.length).to.be.equal(1);
      expect(objects[0].object.aboutme).to.be.equal(newAliceAboutMe);
    }
  });

  after('clean up', async () => {
    const promises = Promise.all([
      firstInstance.remove(),
      secondInstance.remove(),
    ]);
    await promises;
  });
});
