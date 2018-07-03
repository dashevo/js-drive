const removeContainers = require('../../../../../lib/test/services/docker/removeContainers');
const startDashCoreInstance = require('../../../../../lib/test/services/dashCore/startDashCoreInstance');

const getStateTransitionPackets = require('../../../../../lib/test/fixtures/getTransitionPacketFixtures');

const registerUser = require('../../../../../lib/test/registerUser');
const createDapContractST = require('../../../../../lib/test/createDapContractST');

const wait = require('../../../../../lib/test/util/wait');

/**
 * Await Dash Core instance to finish syncing
 *
 * @param {DashCoreInstance} instance
 * @returns {Promise<void>}
 */
async function dashCoreSyncToFinish(instance, name, timeout = 90000) {
  let finished = false;
  const startedAt = process.hrtime();
  while (!finished) {
    const status = await instance.rpcClient.mnsync('status');
    const now = process.hrtime(startedAt);
    const millisPassed = ((now[0] * 1e9) + now[1]) / 1e6;
    if (status.result.IsSynced) {
      finished = true;
    } else if (millisPassed >= timeout) {
      throw new Error(`Timeout waiting for Dash Core (${name} node) to sync`);
    } else {
      await wait(3000);
    }
  }
}

async function createAndSubmitST(username, packetData, dcInstance) {
  const packetOne = packetData;
  packetOne.data.objects[0].description = `Valid registration for ${username}`;

  const { userId, privateKeyString } =
        await registerUser(username, dcInstance.rpcClient);
  const [, header] = await createDapContractST(userId, privateKeyString, packetOne);

  await dcInstance.rpcClient.sendRawTransition(header);
  await dcInstance.rpcClient.generate(1);
}

describe('syncDashCoreInstances', function main() {
  this.timeout(900000);

  describe('Dash Core Instances', () => {
    beforeEach(removeContainers);

    it('should sync forever if none of the workarounds applied', async () => {
      const [firstInstance] = await startDashCoreInstance.many(2);

      const packetsData = getStateTransitionPackets();

      for (let i = 0; i < 20; i++) {
        await createAndSubmitST(`Alice_${i}`, packetsData[0], firstInstance);
      }

      let errorToCatch;
      try {
        await dashCoreSyncToFinish(firstInstance, 'first');
      } catch (e) {
        errorToCatch = e;
      }

      expect(errorToCatch).to.exist
        .and.be.instanceOf(Error);
    });

    it('should sync if TS propagation goes after user registration', async () => {
      const [firstInstance, secondInstance] = await startDashCoreInstance.many(2);

      const packetsData = getStateTransitionPackets();

      const registrationData = [];
      for (let i = 0; i < 20; i++) {
        const username = `Alice_${i}`;
        const { userId, privateKeyString } =
              await registerUser(username, firstInstance.rpcClient);
        await firstInstance.rpcClient.generate(1);
        registrationData.push({ username, userId, privateKeyString });
      }

      await dashCoreSyncToFinish(firstInstance, 'first');
      await dashCoreSyncToFinish(secondInstance, 'second');

      for (let i = 0; i < 90; i++) {
        const { result: firstBlockCount } = await firstInstance.rpcClient.getBlockCount();
        const { result: secondBlockCount } = await secondInstance.rpcClient.getBlockCount();

        if (firstBlockCount === secondBlockCount) {
          break;
        }

        await wait(1000);
      }

      for (let i = 0; i < registrationData.length; i++) {
        const { username, userId, privateKeyString } = registrationData[i];

        const packetOne = packetsData[0];
        packetOne.data.objects[0].description = `Valid registration for ${username}`;

        const [, header] = await createDapContractST(userId, privateKeyString, packetOne);

        await firstInstance.rpcClient.sendRawTransition(header);
        await firstInstance.rpcClient.generate(1);
      }

      await dashCoreSyncToFinish(firstInstance, 'first');
      await dashCoreSyncToFinish(secondInstance, 'second');
    });

    it('should sync if `msync("next")` called a few times', async () => {
      const [firstInstance, secondInstance] = await startDashCoreInstance.many(2);

      for (let i = 0; i < 6; i++) {
        await firstInstance.rpcClient.mnsync('next');
        await secondInstance.rpcClient.mnsync('next');
      }

      const packetsData = getStateTransitionPackets();

      for (let i = 0; i < 20; i++) {
        await createAndSubmitST(`Alice_${i}`, packetsData[0], firstInstance);
      }

      await dashCoreSyncToFinish(firstInstance, 'first');
      await dashCoreSyncToFinish(secondInstance, 'second');
    });

    it('should sync if both instances connected', async () => {
      const [firstInstance, secondInstance] = await startDashCoreInstance.many(2);
      secondInstance.connect(firstInstance);

      const packetsData = getStateTransitionPackets();

      for (let i = 0; i < 20; i++) {
        await createAndSubmitST(`Alice_${i}`, packetsData[0], firstInstance);
      }

      await dashCoreSyncToFinish(firstInstance, 'first');
      await dashCoreSyncToFinish(secondInstance, 'second');
    });

    it('should sync if second instances connected to the first', async () => {
      const firstInstance = await startDashCoreInstance();
      const secondInstance = await startDashCoreInstance();
      secondInstance.connect(firstInstance);

      const packetsData = getStateTransitionPackets();

      for (let i = 0; i < 20; i++) {
        await createAndSubmitST(`Alice_${i}`, packetsData[0], firstInstance);
      }

      await dashCoreSyncToFinish(firstInstance, 'first');
      await dashCoreSyncToFinish(secondInstance, 'second');
    });

    after(removeContainers);
  });
});
