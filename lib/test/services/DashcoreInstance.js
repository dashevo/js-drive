const Docker = require('dockerode');
const RpcClient = require('@dashevo/bitcoind-rpc-dash/promise');

class DashcoreInstance {
  constructor() {
    this.options = this.createOptions();
    this.container = null;
    this.rpcClient = null;
    this.containerIp = null;
    this.isInitialized = false;
  }

  async start() {
    if (this.isInitialized) {
      return;
    }

    await this.createNetwork();
    this.container = await this.createContainer();
    this.rpcClient = await this.createRpcClient();

    this.isInitialized = true;
  }

  async stop() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();

    this.isInitialized = false;
  }

  async clean() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();
    await this.container.remove();

    this.isInitialized = false;
  }

  getIp() {
    return this.containerIp;
  }

  getApi() {
    return this.rpcClient;
  }

  getZmqSockets() {
    return {
      hashblock: `tcp://127.0.0.1:${this.options.ZMQ.port}`,
    };
  }

  async createNetwork() {
    const docker = new Docker();
    await docker.createNetwork({
      Name: this.options.NETWORK.name,
      Driver: 'bridge',
      CheckDuplicate: true,
    }).catch(() => null);
  }

  async createContainer() {
    const { port: rpcPort, user: rpcUser, password: rpcPassword } = this.options.RPC;
    const { port: pubPort } = this.options.ZMQ;

    const ExposedPorts = {};
    ExposedPorts[`${rpcPort}/tcp`] = {};
    ExposedPorts[`${pubPort}/tcp`] = {};

    const PortBindings = {};
    PortBindings[`${rpcPort}/tcp`] = [{ HostPort: rpcPort.toString() }];
    PortBindings[`${pubPort}/tcp`] = [{ HostPort: pubPort.toString() }];

    const EndpointsConfig = {};
    EndpointsConfig[this.options.NETWORK.name] = {};

    const docker = new Docker();
    let container = await docker.createContainer({
      Image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      Cmd: [
        'dashd',
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${rpcPort}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${pubPort}`,
      ],
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig,
      },
    });

    try {
      await container.start();
      const { NetworkSettings: { Networks } } = await container.inspect();
      this.containerIp = Networks[this.options.NETWORK.name].IPAddress;
      return container;
    } catch (error) {
      this.options = this.createOptions();
      container = await this.createContainer(this.options);
      return container;
    }
  }

  async createRpcClient() {
    return new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: this.options.RPC.port,
      user: this.options.RPC.user,
      pass: this.options.RPC.password,
    });
  }

  createOptions() {
    return {
      RPC: {
        port: this.getRandomPort(20002, 29998),
        user: 'dashrpc',
        password: 'password',
      },
      ZMQ: {
        port: this.getRandomPort(30002, 39998),
      },
      NETWORK: {
        name: 'dash_test_network',
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getRandomPort(min, max) {
    return Math.floor((Math.random() * ((max - min) + 1)) + min);
  }
}

module.exports = DashcoreInstance;
