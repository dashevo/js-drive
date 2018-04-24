const Docker = require('dockerode');

const DashCoreInstanceOptions = require('../../../../lib/test/services/dashCore/DashCoreInstanceOptions');
const Container = require('../../../../lib/test/services/docker/Container');

describe('Container', function main() {
  this.timeout(40000);

  const options = new DashCoreInstanceOptions();

  describe('before start', () => {
    const container = new Container(options);

    it('should not crash if stop', async () => {
      await container.stop();
    });

    it('should not crash if remove', async () => {
      await container.remove();
    });

    it('should return null if getIp', () => {
      const ip = container.getIp();
      expect(ip).to.be.null();
    });
  });

  describe('usage', () => {
    const container = new Container(options);

    after(async () => container.remove());

    it('should start a container with DashCoreInstanceOptions network options', async () => {
      await container.start();
      const network = new Docker().getNetwork(options.getNetworkName());
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await container.details();
      const networks = Object.keys(Networks);
      expect(Driver).to.equal(options.getNetworkDriver());
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal(options.getNetworkName());
    });

    it('should start a container with the DashCoreInstanceOptions options', async () => {
      await container.start();
      const { Args } = await container.details();
      expect(Args).to.deep.equal([
        `-port=${options.getMainPort()}`,
        `-rpcuser=${options.getRpcUser()}`,
        `-rpcpassword=${options.getRpcPassword()}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${options.getRpcPort()}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${options.getZmqPort()}`,
      ]);
    });

    it('should not crash if start is called multiple times', async () => {
      await container.start();
      await container.start();
    });

    it('should stop the container', async () => {
      await container.stop();
      const { State } = await container.details();
      expect(State.Status).to.equal('exited');
    });

    it('should start after stop', async () => {
      await container.start();
      const { State } = await container.details();
      expect(State.Status).to.equal('running');
    });

    it('should return container IP', () => {
      expect(container.getIp()).to.be.equal(container.getIp());
    });

    it('should remove the container', async () => {
      await container.remove();

      let error;
      try {
        await container.details();
      } catch (err) {
        error = err;
      }
      expect(error.statusCode).to.equal(404);
      expect(error.reason).to.equal('no such container');
    });
  });

  describe('containers removal', () => {
    const containerOne = new Container(options);
    const containerTwo = new Container(options);
    const containerThree = new Container(options);
    let sandbox;

    beforeEach(function before() {
      sandbox = this.sinon;
    });
    after(async () => {
      await Promise.all([
        containerOne.remove(),
        containerTwo.remove(),
        containerThree.remove(),
      ]);
    });

    it('should call createContainer only once when start/stop/start', async () => {
      const createContainerSpy = sandbox.spy(containerOne, 'create');

      await containerOne.start();
      await containerOne.stop();
      await containerOne.start();

      expect(createContainerSpy.callCount).to.equal(1);
    });

    it('should remove instance if port if busy before creating a new one', async () => {
      containerTwo.options = containerOne.options;
      containerThree.options = containerOne.options;
      const removeContainerSpy = sandbox.spy(containerThree, 'removeContainer');

      await containerOne.start();
      await containerTwo.start();
      await containerThree.start();

      expect(removeContainerSpy.callCount).to.be.equal(1);
    });
  });

  describe('ports', () => {
    const containerOne = new Container(options);
    const containerTwo = new Container(options);
    const containerThree = new Container(options);

    let sandbox;

    beforeEach(function before() {
      sandbox = this.sinon;
    });
    after(async () => {
      await Promise.all([
        containerOne.remove(),
        containerTwo.remove(),
        containerThree.remove(),
      ]);
    });

    it('should retry start container with another port if it is busy', async () => {
      containerTwo.options = containerOne.options;
      containerThree.options = containerOne.options;
      const instanceThreeSpy = sandbox.spy(containerThree, 'create');

      await containerOne.start();
      await containerTwo.start();
      await containerThree.start();

      expect(instanceThreeSpy.callCount).to.be.equal(2);
    });
  });
});
