const proxyquire = require('proxyquire');
const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');

use(sinonChai);
use(dirtyChai);

const EventEmitter = require('events');
const getTransitionHeaderFixtures = require('../../lib/test/fixtures/getTransitionHeaderFixtures');

describe('pinSTPacketsByEvents', () => {
  let transitionHeader;
  let ipfsAPIMock;
  let zmqSocketMock;
  let loggerMock;
  let pinSTPacketByHeaderStub;
  let pinSTPacketsByEvents;

  beforeEach(function beforeEach() {
    if (!this.sinon) {
      this.sinon = sinon.sandbox.create();
    } else {
      this.sinon.restore();
    }

    [transitionHeader] = getTransitionHeaderFixtures();

    // Mock IPFS API
    class IpfsAPI {
    }

    ipfsAPIMock = new IpfsAPI();

    class Socket extends EventEmitter {
    }

    zmqSocketMock = new Socket();
    zmqSocketMock.subscribe = this.sinon.stub();

    loggerMock = {
      error: this.sinon.stub(),
    };

    pinSTPacketByHeaderStub = this.sinon.stub();
    pinSTPacketByHeaderStub.returns(Promise.resolve());

    pinSTPacketsByEvents = proxyquire('../../lib/storage/pinSTPacketsByEvents', {
      './pinSTPacketByHeader': pinSTPacketByHeaderStub,
    });
  });

  it('should add packet on event', async () => {
    await pinSTPacketsByEvents(ipfsAPIMock, zmqSocketMock, loggerMock);

    zmqSocketMock.emit('message', 'rawts', transitionHeader);

    expect(zmqSocketMock.subscribe).to.be.calledWith('zmqpubrawst');

    expect(loggerMock.error).not.to.be.called();

    // pinSTPacketByHeader was called as expected
    expect(pinSTPacketByHeaderStub).to.be.calledWith(ipfsAPIMock);
    const actualHash = pinSTPacketByHeaderStub.getCall(0).args[1].getHash();
    const expectedHash = transitionHeader.getHash();
    expect(actualHash).to.be.equal(expectedHash);
  });
});
