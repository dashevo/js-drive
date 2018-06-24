const startIPFSInstance = require('../../../lib/test/services/mocha/startIPFSInstance');

const StateTransitionHeader = require('../../../lib/blockchain/StateTransitionHeader');

const getTransitionHeaderFixtures = require('../../../lib/test/fixtures/getTransitionHeaderFixtures');

describe('pinUnknown', () => {
  let ipfsApi;
  let stHeader;

  startIPFSInstance.many(2).then(([instance]) => {
    ipfsApi = instance.getApi();
  });

  before(() => {
    const [stHeaderData] = getTransitionHeaderFixtures();
    stHeader = new StateTransitionHeader(stHeaderData);
  });

  it('pin unknown package', function it(done) {
    this.timeout(60000);

    const closure = () => ipfsApi.pin.add(stHeader.getPacketCID());
    const error = "invalid 'ipfs ref' path";

    expect(closure()).to.eventually.be.rejectedWith(error).and.notify(done);
  });
});
