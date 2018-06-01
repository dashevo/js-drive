const getTransitionHeaderFixtures = require('../lib/test/fixtures/getTransitionHeaderFixtures');

/**
 * Store DAP contract handler
 *
 * @param {STHeadersReader} stHeadersReader
 * @param {storeDapContract} storeDapContract
 */
function storeDapContractHandler(stHeadersReader, storeDapContract) {
  stHeadersReader.on('header', async (header) => {
    const cid = header.getPacketCID();
    await storeDapContract(cid);
  });
}

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
