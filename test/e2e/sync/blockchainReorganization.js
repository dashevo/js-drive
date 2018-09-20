const addSTPacketFactory = require('../../../lib/storage/ipfs/addSTPacketFactory');
const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');
const StateTransitionPacket = require('../../../lib/storage/StateTransitionPacket');

const registerUser = require('../../../lib/test/registerUser');
const createSTHeader = require('../../../lib/test/createSTHeader');

const { startDashDrive } = require('js-evo-services-ctl');

const wait = require('../../../lib/util/wait');
const cbor = require('cbor');

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

  const { result: tsId } = await instance.dashCore.getApi().sendRawTransition(header);
  await instance.dashCore.getApi().generate(1);

  return { packetCid, tsId };
}

async function blockCountEvenAndEqual(
  instanceOne,
  instanceTwo,
  desiredBlockCount = -1,
  timeout = 90,
) {
  for (let i = 0; i < timeout; i++) {
    const { result: blockCountOne } = await instanceOne.getApi().getBlockCount();
    const { result: blockCountTwo } = await instanceTwo.getApi().getBlockCount();

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

/**
 * Await Dash Drive instance to finish syncing
 *
 * @param {DriveApi} instance
 * @returns {Promise<void>}
 */
async function dashDriveSyncToFinish(instance) {
  const packet = getStateTransitionPackets()[0];
  const serializedPacket = cbor.encodeCanonical(packet.toJSON({ skipMeta: true }));
  const serializedPacketJson = {
    packet: serializedPacket.toString('hex'),
  };

  let finished = false;
  while (!finished) {
    try {
      const response = await instance.getApi()
        .request('addSTPacket', serializedPacketJson);
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

async function createDAPObjects(instance, dapId, stPacket, ...users) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    const userData = Object.assign({}, stPacket, {
      dapid: dapId,
      dapobjects: [
        {
          objtype: 'user',
          aboutme: user.aboutMe,
          pver: 1,
          idx: 0,
          rev: 1,
          act: 1,
        },
      ],
    });

    user.userData = userData;

    ({ tsId: user.prevTransitionId } = await createAndSubmitST(
      user.userId,
      user.privateKeyString,
      user.username,
      userData,
      instance,
      user.prevTransitionId,
    ));
  }
}

describe('Blockchain reorganization', function main() {
  let firstDashDrive;
  let secondDashDrive;

  let stPackets;

  let registeredUsers;

  let dapId;

  const BLOCKS_ST_ACTIVATION = 1000;

  this.timeout(900000);

  before('having started Dash Drive node and generated some STs', async () => {
    registeredUsers = [];

    stPackets = getStateTransitionPackets();

    // 1. Start two full Dash Drive instances
    [firstDashDrive, secondDashDrive] = await startDashDrive.many(2);

    // 1.1 Activate Special Transactions
    await firstDashDrive.dashCore.getApi().generate(BLOCKS_ST_ACTIVATION);

    // 2. Register a bunch of users on a blockchain
    for (let i = 0; i < 10; i++) {
      const user = {
        username: `BC_USER_${i}`,
        aboutMe: `Something about BC_USER_${i}`,
        prevTransitionId: undefined,
      };

      ({ userId: user.userId, privateKeyString: user.privateKeyString } =
        await registerUser(user.username, firstDashDrive.dashCore.getApi()));

      registeredUsers.push(user);
    }

    // 2.1 Await number of blocks even on both nodes
    await blockCountEvenAndEqual(
      firstDashDrive.dashCore,
      secondDashDrive.dashCore,
    );

    // 3. Create DAP Contract
    ({ tsId: dapId } = await createAndSubmitST(
      registeredUsers[0].userId,
      registeredUsers[0].privateKeyString,
      registeredUsers[0].username,
      stPackets[0],
      firstDashDrive,
    ));

    // Assign `dapId` as `prevTransitionId` for the first user
    registeredUsers[0].prevTransitionId = dapId;

    // 3.1 Await block count to be equal on both nodes
    await blockCountEvenAndEqual(
      firstDashDrive.dashCore,
      secondDashDrive.dashCore,
    );

    // 4. Register 2 `user` DAP Objects
    await createDAPObjects(
      firstDashDrive,
      dapId,
      stPackets[1],
      registeredUsers[0],
      registeredUsers[1],
    );

    // 4.1 Await block count to be equal on both nodes
    await blockCountEvenAndEqual(
      firstDashDrive.dashCore,
      secondDashDrive.dashCore,
    );

    // 4.2 Await for initial sync to finish
    await dashDriveSyncToFinish(firstDashDrive.driveApi);
    await dashDriveSyncToFinish(secondDashDrive.driveApi);

    // Ensure first Dash Drive have a proper data
    {
      const response = await firstDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(2);

      const aboutMes = objects.map(o => o.object.aboutme);

      for (let i = 0; i < 2; i++) {
        expect(aboutMes).to.include(registeredUsers[i].aboutMe);
      }
    }

    // Ensure second Dash Drive have a proper data
    {
      const response = await secondDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(2);

      const aboutMes = objects.map(o => o.object.aboutme);

      for (let i = 0; i < 2; i++) {
        expect(aboutMes).to.include(registeredUsers[i].aboutMe);
      }
    }
  });

  it('Dash Drive should sync data after blockchain reorganization, removing missing STs. Adding them back after they reappear in the blockchain.', async () => {
    // 4. Disconnecting nodes to start introducing difference in blocks
    firstDashDrive.dashCore.disconnect(secondDashDrive.dashCore);

    // 5. Register 2 more `user` DAP Objects on the first node
    await createDAPObjects(
      firstDashDrive,
      dapId,
      stPackets[1],
      registeredUsers[2],
      registeredUsers[3],
    );

    // 6. Register 3 more `user` DAP Objects on the second node
    await createDAPObjects(
      secondDashDrive,
      dapId,
      stPackets[1],
      registeredUsers[4],
      registeredUsers[5],
      registeredUsers[6],
    );

    await wait(30000);

    // 7. Reconnect nodes
    await firstDashDrive.dashCore.connect(secondDashDrive.dashCore);

    // 7.1 Await equal number of blocks on both nodes
    await blockCountEvenAndEqual(
      firstDashDrive.dashCore,
      secondDashDrive.dashCore,
    );

    await wait(30000);

    // 8. Ensure first Dash Drive have only 5 `user` DAP Objects
    //    0, 1, 4, 5, 6 as a result of reorganization
    const aboutMesAfterReconnect = [
      registeredUsers[0].aboutMe,
      registeredUsers[1].aboutMe,
      registeredUsers[4].aboutMe,
      registeredUsers[5].aboutMe,
      registeredUsers[6].aboutMe,
    ];

    {
      const response = await firstDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(5);

      const aboutMes = objects.map(o => o.object.aboutme);

      aboutMesAfterReconnect.forEach((aboutMe) => {
        expect(aboutMes).to.include(aboutMe);
      });
    }

    {
      const response = await secondDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(5);

      const aboutMes = objects.map(o => o.object.aboutme);

      aboutMesAfterReconnect.forEach((aboutMe) => {
        expect(aboutMes).to.include(aboutMe);
      });
    }

    // 9. Generate more blocks so TSes reappear on the blockchain
    await firstDashDrive.dashCore.getApi().generate(10);

    await blockCountEvenAndEqual(
      firstDashDrive.dashCore,
      secondDashDrive.dashCore,
    );

    await wait(30000);

    // 10. Check all of the `user` DAP Objects are present after more blocks generated
    const aboutMesAfterGenerate = [
      registeredUsers[0].aboutMe,
      registeredUsers[1].aboutMe,
      registeredUsers[2].aboutMe,
      registeredUsers[3].aboutMe,
      registeredUsers[4].aboutMe,
      registeredUsers[5].aboutMe,
      registeredUsers[6].aboutMe,
    ];

    {
      const response = await firstDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(7);

      const aboutMes = objects.map(o => o.object.aboutme);

      aboutMesAfterGenerate.forEach((aboutMe) => {
        expect(aboutMes).to.include(aboutMe);
      });
    }

    {
      const response = await secondDashDrive.driveApi.getApi()
        .request('fetchDapObjects', { dapId, type: 'user' });

      const objects = response.result;

      expect(objects.length).to.be.equal(7);

      const aboutMes = objects.map(o => o.object.aboutme);

      aboutMesAfterGenerate.forEach((aboutMe) => {
        expect(aboutMes).to.include(aboutMe);
      });
    }
  });

  after('cleanup lone services', async () => {
    const instances = [
      firstDashDrive,
      secondDashDrive,
    ];

    await Promise.all(instances.filter(i => i)
      .map(i => i.remove()));
  });
});
