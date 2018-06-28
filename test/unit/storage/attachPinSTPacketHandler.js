const Emitter = require('emittery');
const proxyquire = require('proxyquire');

const RpcClientMock = require('../../../lib/test/mock/RpcClientMock');

describe('attachPinSTPacketHandler', () => {
  let rpcClientMock;
  let ipfsAPIMock;
  let stHeadersReaderMock;
  let rejectAfterMock;
  let attachPinSTPacketHandler;

  beforeEach(function beforeEach() {
    rpcClientMock = new RpcClientMock(this.sinon);

    // Mock IPFS API
    const sinonSandbox = this.sinon;
    class IpfsAPI {
      constructor() {
        this.pin = {
          add: sinonSandbox.stub(),
          rm: sinonSandbox.stub(),
        };
      }
    }

    ipfsAPIMock = new IpfsAPI();

    // Mock STHeadersReader
    class STHeadersReader extends Emitter {
      constructor() {
        super();

        this.stHeaderIterator = {
          rpcClient: rpcClientMock,
        };
      }
    }

    stHeadersReaderMock = new STHeadersReader();

    rejectAfterMock = this.sinon.stub();
    attachPinSTPacketHandler = proxyquire('../../../lib/storage/attachPinSTPacketHandler', {
      '../util/rejectAfter': rejectAfterMock,
    });

    attachPinSTPacketHandler(stHeadersReaderMock, ipfsAPIMock);
  });

  it('should pin ST packets when new header appears', async () => {
    const [header] = rpcClientMock.transitionHeaders;

    const pinPromise = Promise.resolve();
    ipfsAPIMock.pin.add.returns(pinPromise);

    await stHeadersReaderMock.emitSerial('header', header);

    expect(ipfsAPIMock.pin.add).to.be.calledOnce();
    expect(ipfsAPIMock.pin.add).to.be.calledWith(header.getPacketCID(), { recursive: true });

    expect(rejectAfterMock).to.be.calledOnce();

    const calledWithArgs = rejectAfterMock.firstCall.args;

    expect(calledWithArgs[0]).to.be.equal(pinPromise);
    expect(calledWithArgs[1].name).to.be.equal('InvalidPacketCidError');
    expect(calledWithArgs[2]).to.be.equal(attachPinSTPacketHandler.PIN_REJECTION_TIMEOUT);
  });

  it('should unpin ST packets in case of reorg', async () => {
    const [block] = rpcClientMock.blocks;

    await stHeadersReaderMock.emitSerial('wrongSequence', block);

    expect(ipfsAPIMock.pin.rm).has.callCount(block.ts.length);

    rpcClientMock.transitionHeaders.slice(0, block.ts.length).forEach((header) => {
      expect(ipfsAPIMock.pin.rm).to.be.calledWith(header.getPacketCID(), { recursive: true });
    });
  });
});
