const { mocha: { startIPFS } } = require('@dashevo/js-evo-services-ctl');

const STPacketIpfsRepository = require('../../../lib/storage/stPacket/STPacketIpfsRepository');

const getSTPacketsFixture = require('../../../lib/test/fixtures/getSTPacketsFixture');
const getStateTransitionsFixture = require('../../../lib/test/fixtures/getStateTransitionsFixture');

const createDPPMock = require('../../../lib/test/mock/createDPPMock');

describe('StateTransition', () => {
  let dppMock;
  let stPacket;
  let stateTransition;
  let stPacketRepository;
  let ipfsApi;

  startIPFS().then((ipfs) => {
    ipfsApi = ipfs.getApi();
  });

  beforeEach(function beforeEach() {
    dppMock = createDPPMock(this.sinon);

    [stPacket] = getSTPacketsFixture();
    [stateTransition] = getStateTransitionsFixture();

    stPacketRepository = new STPacketIpfsRepository(
      ipfsApi,
      dppMock,
      1000,
    );
  });

  describe('#getPacketCID', () => {
    it('should create packet CID', async () => {
      stateTransition.extraPayload.setHashSTPacket(stPacket.hash());
      const stPacketCID = stateTransition.getPacketCID();

      const ipfsCID = await stPacketRepository.store(stPacket);

      expect(stPacketCID.equals(ipfsCID)).to.be.true();
    });
  });
});
