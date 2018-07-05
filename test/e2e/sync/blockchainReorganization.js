const addSTPacketFactory = require('../../../lib/storage/ipfs/addSTPacketFactory');
const getStateTransitionPackets = require('../../../lib/test/fixtures/getTransitionPacketFixtures');

const registerUser = require('../../../lib/test/registerUser');
const createDapContractST = require('../../../lib/test/createDapContractST');

const startDashDriveInstance = require('../../../lib/test/services/dashDrive/startDashDriveInstance');

const wait = require('../../../lib/test/util/wait');

async function createAndSubmitST(username, basePacketData, instance) {
  const packetData = Object.assign({}, basePacketData);
  packetData.data.objects[0].description = `Valid registration for ${username}`;

  const { userId, privateKeyString } =
        await registerUser(username, instance.dashCore.rpcClient);
  const [packet, header] = await createDapContractST(userId, privateKeyString, packetData);

  const addSTPacket = addSTPacketFactory(instance.ipfs.getApi());
  const packetCid = await addSTPacket(packet);

  const { result: tsid } = await instance.dashCore.rpcClient.sendRawTransition(header);
  await instance.dashCore.rpcClient.generate(1);

  return { packetCid, tsid };
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
      if (blockCountOne === desiredBlockCount) {
        break;
      } else {
        throw new Error(`Block count of ${blockCountOne} is not desirable ${desiredBlockCount}`);
      }
    } else if (i === timeout - 1) {
      throw new Error('Timeout waiting for block count to be equal on both nodes');
    }

    await wait(1000);
  }
}

describe('Blockchain reorganization', function main() {
  let firstInstance;
  let secondInstance;

  let packetsCids;
  let packetsAddedAfterDisconnect;
  let stPackets;
  let tsesAfterDisconnect;

  const BLOCKS_PER_ST = 109;

  this.timeout(900000);

  before('having started Dash Drive node and generated some STs', async () => {
    packetsCids = [];
    packetsAddedAfterDisconnect = [];
    tsesAfterDisconnect = [];

    stPackets = getStateTransitionPackets();

    // 1. Start two full Dash Drive instances
    [firstInstance, secondInstance] = await startDashDriveInstance.many(2);

    // 2. Populate instance of Dash Drive and Dash Core with data
    //    First two STs, should be equal on both nodes
    for (let i = 0; i < 2; i++) {
      const { packetCid } = await createAndSubmitST(`Alice_${i}`, stPackets[0], firstInstance);
      packetsCids.push(packetCid);
    }

    // 3. Await block count to be equal on both nodes
    //    Should be equal number of generated STs times number of blocks per ST
    await blockCountEvenAndEqual(
      firstInstance.dashCore,
      secondInstance.dashCore,
      2 * BLOCKS_PER_ST,
    );
  });

  it('Dash Drive should syncdata after blockchain reorganization, removing missing STs. Adding them back after they reappear in the blockchain.', async () => {
    // 4. Disconnecting nodes to start introducing difference in blocks
    //    TODO: implement `disconnect` method for DashCoreInstance
    const ip = secondInstance.dashCore.getIp();
    const port = secondInstance.dashCore.options.getDashdPort();
    await firstInstance.dashCore.rpcClient.disconnectNode(`${ip}:${port}`);
    await firstInstance.dashCore.rpcClient.addNode(`${ip}:${port}`, 'remove');

    // 5. Generate two more ST on the first node
    //    Note: keep track of exact those CIDs as they should disappear after reorganization
    //    Note: keep track of tsid as well to check if it's moved in mempool later on
    for (let i = 2; i < 4; i++) {
      const { packetCid, tsid } = await createAndSubmitST(`Alice_${i}`, stPackets[0], firstInstance);
      packetsCids.push(packetCid);
      packetsAddedAfterDisconnect.push(packetCid);
      tsesAfterDisconnect.push(tsid);
    }

    // Check tses are not in mempool
    for (let i = 0; i < tsesAfterDisconnect.length - 1; i++) {
      const tsid = tsesAfterDisconnect[i];
      const { result: tsData } = await firstInstance.dashCore.rpcClient.getTransition(tsid);
      expect(tsData.from_mempool).to.not.exist();
    }

    // 6. Check proper block count on the first node
    {
      const { result: blockCount } = await firstInstance.dashCore.rpcClient.getBlockCount();
      expect(blockCount).to.be.equal(4 * BLOCKS_PER_ST);
    }

    // 7. Generate slightly larger amount of STs on the second node
    //    to introduce reorganization
    for (let i = 4; i < 7; i++) {
      const { packetCid } = await createAndSubmitST(`Alice_${i}`, stPackets[0], secondInstance);
      packetsCids.push(packetCid);
    }

    // 8. Check proper block count on the second node
    {
      const { result: blockCount } = await secondInstance.dashCore.rpcClient.getBlockCount();
      expect(blockCount).to.be.equal(5 * BLOCKS_PER_ST);
    }

    // 9. Reconnect nodes
    await firstInstance.dashCore.connect(secondInstance.dashCore);

    // 10. Await equal block count on both nodes
    //     Notes: should be equal to largest chain
    await blockCountEvenAndEqual(
      firstInstance.dashCore,
      secondInstance.dashCore,
      5 * BLOCKS_PER_ST,
    );

    // Check tses are back to mempool
    for (let i = 0; i < tsesAfterDisconnect.length - 1; i++) {
      const tsid = tsesAfterDisconnect[i];
      const { result: tsData } = await firstInstance.dashCore.rpcClient.getTransition(tsid);
      expect(tsData.from_mempool).to.exist()
        .and.be.equal(true);
    }

    // 11. Await Dash Drive to sync
    await wait(20000);

    // 12. Check packet CIDs added after disconnect does not appear in Dash Drive
    {
      const lsResult = await secondInstance.ipfs.getApi().pin.ls();
      const lsHashes = lsResult.map(item => item.hash);

      packetsAddedAfterDisconnect.forEach((cid) => {
        expect(lsHashes).to.not.include(cid);
      });
    }

    {
      const lsResult = await firstInstance.ipfs.getApi().pin.ls();
      const lsHashes = lsResult.map(item => item.hash);

      packetsAddedAfterDisconnect.forEach((cid) => {
        expect(lsHashes).to.not.include(cid);
      });
    }

    // 13. Generate more blocks so TSes reappear on the blockchain
    await firstInstance.dashCore.rpcClient.generate(10);

    // 14. Await Dass Drive to sync
    await wait(20000);

    // 15. Check CIDs reappear in Dash Drive
    {
      const lsResult = await secondInstance.ipfs.getApi().pin.ls();
      const lsHashes = lsResult.map(item => item.hash);

      packetsCids.forEach((cid) => {
        expect(lsHashes).to.include(cid);
      });
    }

    {
      const lsResult = await firstInstance.ipfs.getApi().pin.ls();
      const lsHashes = lsResult.map(item => item.hash);

      packetsCids.forEach((cid) => {
        expect(lsHashes).to.include(cid);
      });
    }
  });

  after('cleanup lone services', async () => {
    const promises = Promise.all([
      firstInstance.remove(),
      secondInstance.remove(),
    ]);
    await promises;
  });
});
