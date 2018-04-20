const Docker = require('dockerode');

const DashDriveInstance = require('../../../../lib/test/services/dashDrive/DashDriveInstance');

describe('DashDriveInstance', function main() {
  this.timeout(90000);

  describe('before start', () => {
    const instance = new DashDriveInstance();

    it('should not crash if stop', async () => {
      await instance.stop();
    });

    it('should not crash if clean', async () => {
      await instance.clean();
    });

    it('should return null if getIp', () => {
      const ip = instance.getIp();
      expect(ip).to.be.null();
    });

    it('should return null if getAddress', () => {
      const address = instance.getAddress();
      expect(address).to.be.null();
    });
  });

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
    const instance = new DashDriveInstance({
      ENV,
    });

    after(async () => instance.clean());

    it('should start an instance with a bridge dash_test_network', async () => {
      await instance.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await instance.container.inspect();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should not crash if start is called multiple times', async () => {
      await instance.start();
      await instance.start();
    });

    it('should start an instance with custom environment variables', async () => {
      await instance.start();
      const { Config: { Env } } = await instance.container.inspect();

      const instanceEnv = Env.filter(variable => ENV.includes(variable));
      expect(ENV.length).to.deep.equal(instanceEnv.length);
    });

    it('should start an instance with the default options', async () => {
      await instance.start();
      const { Args } = await instance.container.inspect();
      expect(Args).to.deep.equal(['run', 'sync']);
    });

    it('should stop the instance', async () => {
      await instance.stop();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await instance.start();
      const { State } = await instance.container.inspect();
      expect(State.Status).to.equal('running');
    });

    it('should return container IP', () => {
      expect(instance.getIp()).to.be.equal(instance.container.getIp());
    });

    it('should return container address', () => {
      expect(instance.getAddress()).to.be.equal(`${instance.container.getIp()}`);
    });

    it('should clean the instance', async () => {
      await instance.clean();

      let error;
      try {
        await instance.container.inspect();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });
});
