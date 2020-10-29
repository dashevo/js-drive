const EventEmitter = require('events');
const waitForDMLSyncFactory = require('../../../lib/core/waitForDMLSyncFactory');

describe('waitForDMLSyncFactory', () => {
  let waitForDMLSync;
  let coreRpcClientMock;
  let network;
  let latestCoreChainLockMock;
  let chainLock;

  beforeEach(function beforeEach() {
    network = 'regtest';

    chainLock = {
      height: 84202,
      blockHash: '0000000007e0a65b763c0a4fb2274ff757abdbd19c9efe9de189f5828c70a5f4',
      signature: '0a43f1c3e5b3e8dbd670bca8d437dc25572f72d8e1e9be673e9ebbb606570307c3e5f5d073f7beb209dd7e0b8f96c751060ab3a7fb69a71d5ccab697b8cfa5a91038a6fecf76b7a827d75d17f01496302942aa5e2c7f4a48246efc8d3941bf6c',
    };

    coreRpcClientMock = {
      getBlockCount: this.sinon.stub().resolves({ result: 1000 }),
      protx: this.sinon.stub(),
    };

    latestCoreChainLockMock = new EventEmitter();
    latestCoreChainLockMock.getChainLock = this.sinon.stub().returns(chainLock);

    waitForDMLSync = waitForDMLSyncFactory(
      coreRpcClientMock,
      latestCoreChainLockMock,
      network,
    );
  });

  it('should wait for 1000 height', async () => {
    coreRpcClientMock.getBlockCount.onCall(0).resolves({ result: 999 });

    await waitForDMLSync();
  });

  it('should obtain diff from core rpc', async () => {

  });

  it('should update diff on chainLock update', async () => {

  });
});
