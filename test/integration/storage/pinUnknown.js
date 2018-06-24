const startIPFSInstance = require('../../../lib/test/services/mocha/startIPFSInstance');

const StateTransitionHeader = require('../../../lib/blockchain/StateTransitionHeader');

const throwAfter = require('../../../lib/util/throwAfter');

const wait = require('../../../lib/test/util/wait');

const getTransitionHeaderFixtures = require('../../../lib/test/fixtures/getTransitionHeaderFixtures');

describe('pinUnknown', function pinUnknown() {
  let ipfsApi;
  let stHeader;

  this.timeout(10000);

  startIPFSInstance().then((instance) => {
    ipfsApi = instance.getApi();
  });

  beforeEach(() => {
    const [stHeaderData] = getTransitionHeaderFixtures();
    stHeader = new StateTransitionHeader(stHeaderData);
  });

  it('pin gets stuck', async () => {
    await ipfsApi.pin.add(stHeader.getPacketCID());
  });

  it('pin gets stuck with unknown CID and throws context canceled error on Node.JS process exit', async () => {
    const closure = () => ipfsApi.pin.add(stHeader.getPacketCID());
    const promise = closure();

    await wait(5000);

    expect(promise).to.be.rejected('context canceled');

    // expect(promise).to.not.be.rejected() leads to
    // Error: pin: failed to get block for ...: context canceled
    // from https://github.com/ipfs/go-ipfs/blob/08fb11fa896704d9e081bf64e66fac1f6d9d03dc/merkledag/merkledag.go#L77
  });

  it('pin throws error after timeout', (done) => {
    const error = new Error('timeout');

    const closure = () => {
      const promise = ipfsApi.pin.add(stHeader.getPacketCID());

      return throwAfter(promise, error, 5000);
    };

    expect(closure()).to.be.eventually.rejectedWith(error).and.notify(done);
  });

  it('pin throws error after timeout and remove cid from wantlist', async () => {
    const error = new Error('timeout');
    const cid = stHeader.getPacketCID();
    const promise = ipfsApi.pin.add(cid);

    try {
      await throwAfter(promise, error, 5000);
    } catch (e) {
      if (e !== error) {
        throw error;
      }
      await ipfsApi.bitswap.unwant(cid);
    }

    const { Keys: keys } = await ipfsApi.bitswap.wantlist();

    expect(keys).to.be.empty();

    // TODO: It seems we need to cancel request somehow before removing from this CID from wantlist
  });
});
