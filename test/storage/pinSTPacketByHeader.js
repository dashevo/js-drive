const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

use(sinonChai);

const pinSTPacketByHeader = require('../../lib/storage/pinSTPacketByHeader');
const getTransitionHeaderFixtures = require('../../lib/test/fixtures/getTransitionHeaderFixtures');

describe('pinSTPacketByHeader', () => {
  let transitionHeaders;
  let ipfsAPIMock;

  beforeEach(function beforeEach() {
    if (!this.sinon) {
      this.sinon = sinon.sandbox.create();
    } else {
      this.sinon.restore();
    }

    transitionHeaders = getTransitionHeaderFixtures();

    // Mock IPFS API
    class IpfsAPI {
      constructor() {
        this.pin = {};
      }
    }

    ipfsAPIMock = new IpfsAPI();
    ipfsAPIMock.pin.add = this.sinon.spy();
  });

  it('should pin ST packet using storageHash from ST header', async () => {
    const transitionHeader = transitionHeaders[0];
    await pinSTPacketByHeader(ipfsAPIMock, transitionHeader);

    expect(ipfsAPIMock.pin.add).to.be.calledWith(
      transitionHeader.getStorageHash(),
      { recursive: true },
    );
  });
});
