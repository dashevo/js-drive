const getTransitionHeaderFixtures = require('../../../../lib/test/fixtures/getTransitionHeaderFixtures');
const storeDapContractHandler = require('../../../../lib/stateView/dapContract/storeDapContractHandler');

describe('storeDapContractHandler', () => {
  let stHeadersReader;
  let storeDapContract;

  beforeEach(function beforeEach() {
    const header = getTransitionHeaderFixtures()[0];
    stHeadersReader = {
      on: (topic, fn) => fn(header),
    };
    storeDapContract = this.sinon.stub();
    storeDapContractHandler(stHeadersReader, storeDapContract);
  });

  it('should call storeDapContractHandler on new block header', () => {
    expect(storeDapContract).to.be.calledOnce();
  });
});
