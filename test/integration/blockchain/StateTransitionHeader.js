const { mocha: { startIPFS } } = require('@dashevo/js-evo-services-ctl');
const addSTPacketFactory = require('../../../lib/storage/ipfs/addSTPacketFactory');
const getTransitionPacketFixtures = require('../../../lib/test/fixtures/getTransitionPacketFixtures');
const getTransitionHeaderFixtures = require('../../../lib/test/fixtures/getTransitionHeaderFixtures');

describe('StateTransitionHeader', () => {
  let ipfsAPI;
  let addSTPacket;
  let packet;
  let header;

  startIPFS().then((instance) => {
    ipfsAPI = instance.getApi();
  });

  beforeEach(() => {
    [packet] = getTransitionPacketFixtures();
    [header] = getTransitionHeaderFixtures();

    const repositoryMock = {
      find() {
        return packet.dapcontract;
      },
    };

    addSTPacket = addSTPacketFactory(ipfsAPI, repositoryMock);
  });

  it('should StateTransitionHeader CID equal to IPFS CID', async () => {
    header.extraPayload.setHashSTPacket(packet.getHash());

    const ipfsCid = await addSTPacket(packet);

    const stHeaderCid = header.getPacketCID();
    expect(stHeaderCid.toBaseEncodedString()).to.equal(ipfsCid.toBaseEncodedString());
  });
});
