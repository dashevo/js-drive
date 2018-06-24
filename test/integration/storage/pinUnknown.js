const startIPFSInstance = require('../../../lib/test/services/mocha/startIPFSInstance');

describe('pinUnknown', () => {
  let ipfsApi;

  startIPFSInstance.many(2).then(([instance]) => {
    ipfsApi = instance.getApi();
  });

  it('pin unknown package', (done) => {
    const closure = () => ipfsApi.pin.add('unknown');
    const error = "invalid 'ipfs ref' path";

    expect(closure()).to.eventually.be.rejectedWith(error).and.notify(done);
  });
});
