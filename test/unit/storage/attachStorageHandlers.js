const BlockchainReaderMediatorMock = require('../../../lib/test/mock/BlockchainReaderMediatorMock');

const ReaderMediator = require('../../../lib/blockchain/reader/BlockchainReaderMediator');
const RpcClientMock = require('../../../lib/test/mock/RpcClientMock');

const attachStorageHandlers = require('../../../lib/storage/attachStorageHandlers');

describe('attachStorageHandlers', () => {
  let rpcClientMock;
  let readerMediatorMock;
  let stPacketRepositoryMock;

  beforeEach(function beforeEach() {
    rpcClientMock = new RpcClientMock(this.sinon);

    readerMediatorMock = new BlockchainReaderMediatorMock(this.sinon);

    stPacketRepositoryMock = {
      update: this.sinon.stub(),
      delete: this.sinon.stub(),
      deleteAll: this.sinon.stub(),
    };

    attachStorageHandlers(
      readerMediatorMock,
      stPacketRepositoryMock,
    );
  });

  it('should pin ST packet when new state transition appears', async () => {
    const [stateTransition] = rpcClientMock.transitionHeaders;
    const [block] = rpcClientMock.blocks;

    await readerMediatorMock.originalEmitSerial(ReaderMediator.EVENTS.STATE_TRANSITION, {
      stateTransition,
      block,
    });

    const packetPath = stateTransition.getPacketCID().toBaseEncodedString();

    expect(stPacketRepositoryMock.update).to.be.calledOnce();
    expect(stPacketRepositoryMock.update).to.be.calledWith(packetPath);
  });

  it('should unpin ST packets in case of reorg', async () => {
    const [stateTransition] = rpcClientMock.transitionHeaders;
    const [block] = rpcClientMock.blocks;

    await readerMediatorMock.originalEmitSerial(ReaderMediator.EVENTS.STATE_TRANSITION_STALE, {
      stateTransition,
      block,
    });

    const packetPath = stateTransition.getPacketCID().toBaseEncodedString();

    expect(stPacketRepositoryMock.delete).to.be.calledOnce();
    expect(stPacketRepositoryMock.delete).to.be.calledWith(packetPath);
  });

  it('should call unpinAllIpfsPackets on stHeadersReader reset event', async () => {
    await readerMediatorMock.originalEmitSerial(ReaderMediator.EVENTS.RESET);

    expect(stPacketRepositoryMock.deleteAll).to.be.calledOnce();
  });
});
