const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

const ZMQClient = require('@dashevo/dashd-zmq');
const EventEmitter = require('events');
const ensureBlock = require('../../../lib/core/ensureBlock');

describe('ensureBlock', () => {
  const hash = '00000';
  const otherHash = '00001';
  const socketClient = new EventEmitter();
  let rpcClient;
  it('should ensure a block exist before returning promise', (done) => {
    rpcClient = {
      getBlock: async () => true,
    };
    ensureBlock(socketClient, rpcClient, hash)
      .then(() => done());
  });
  it('should wait for block if not found before returning promise', (done) => {
    rpcClient = {
      getBlock: async () => {
        const err = new Error();
        err.code = -5;
        err.message = 'Block not found';
        throw err;
      },
    };
    ensureBlock(socketClient, rpcClient, hash).then(done);

    setTimeout(() => {
      socketClient.emit(ZMQClient.TOPICS.hashblock, otherHash);
      setTimeout(() => {
        socketClient.emit(ZMQClient.TOPICS.hashblock, hash);
      }, 5);
    }, 5);
  });
  it('should throw on unexpected error', async () => {
    const err = new Error();
    err.code = -6;
    err.message = 'Another error';

    rpcClient = {
      getBlock: async () => {
        throw err;
      },
    };

    try {
      await ensureBlock(socketClient, rpcClient, hash);
      expect.fail('Internal error must be thrown');
    } catch (e) {
      expect(e).to.equal(err);
    }
  });
});
