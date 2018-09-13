const RpcClientMock = require('../../../lib/test/mock/RpcClientMock');
const getLastBlockFactory = require('../../../lib/blockchain/getLastBlockFactory');

describe('getLastBlockFactory', () => {
  let rpcClient;
  let getLastBlock;

  beforeEach(function beforeEach() {
    rpcClient = new RpcClientMock(this.sinon);
    getLastBlock = getLastBlockFactory(rpcClient);
  });

  it('should return the last best block on the blockchain', async () => {
    const lastBestBlock = rpcClient.blocks[rpcClient.blocks.length - 1];
    const lastChainBlock = await getLastBlock();
    expect(lastChainBlock).to.be.deep.equal(lastBestBlock);
  });
});
