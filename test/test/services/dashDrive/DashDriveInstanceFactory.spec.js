const Docker = require('dockerode');

const DashDriveInstanceFactory = require('../../../../lib/test/services/dashDrive/DashDriveInstanceFactory');

describe('DashDriveInstanceFactory', function main() {
  this.timeout(90000);

  describe('usage', () => {
    const ENV = [
      'API_RPC_PORT=6000',
      'API_RPC_HOST=0.0.0.0',
      'STORAGE_IPFS_MULTIADDR=/ip4/127.0.0.1/tcp/5001',
      'STORAGE_MONGODB_URL=mongodb://127.0.0.1',
      'STORAGE_MONGODB_DB=storage',
      'DASHCORE_ZMQ_PUB_HASHBLOCK=tcp://127.0.0.1:28332',
      'DASHCORE_JSON_RPC_HOST=127.0.0.1',
      'DASHCORE_JSON_RPC_PORT=9998',
      'DASHCORE_JSON_RPC_USER=dashrpc',
      'DASHCORE_JSON_RPC_PASS=password',
      'SYNC_EVO_START_BLOCK_HEIGHT=1',
      'SYNC_STATE_BLOCKS_LIMIT=12',
      'SYNC_STATE_CHECK_INTERVAL=10',
      'SYNC_CHAIN_CHECK_INTERVAL=5',
    ];
    const instance = DashDriveInstanceFactory.create({
      ENV,
    });

    after(async () => instance.clean());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.details();

      const instanceEnv = Env.filter(variable => ENV.includes(variable));
      expect(ENV.length).to.deep.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.details();
      expect(Args).to.deep.equal(['run', 'sync']);
    });
  });
});
