const Docker = require('dockerode');
const RpcClient = require('@dashevo/bitcoind-rpc-dash/promise');
const zmq = require('zeromq');

class DashcoreInstance {
  constructor({ RPC = {}, ZMQ = {} } = {}) {
    this.options = this.createOptions();
    this.container = null;
    this.network = null;
    this.rpcClient = null;
    this.containerIp = null;
    this.isInitialized = false;
  }

  async start() {
    if (this.isInitialized) {
      return;
    }

    this.network = await this.createNetwork();
    this.container = await this.createContainer(this.options);
    this.rpcClient = await this.createRpcClient(this.options.RPC);

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
    await this.network.remove().catch(error => undefined);

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
      hashblock: `tcp://127.0.0.1:${this.options.ZMQ.port}`
    };
  }

  async createNetwork() {
    const docker = new Docker();
    try {
      return await docker.createNetwork({
        Name: 'dash_test_network',
        Driver: 'bridge',
        CheckDuplicate: true,
      });
    } catch (error) {
      return docker.getNetwork('dash_test_network');
    }
  }

  async createContainer({ RPC, ZMQ }) {
    const { port: initialRpcPort, user: rpcUser, password: rpcPassword } = RPC;
    const { port: initialPubPort } = ZMQ;

    const ExposedPorts = {};
    ExposedPorts[`${initialRpcPort}/tcp`] = {};
    ExposedPorts[`${initialPubPort}/tcp`] = {};

    const PortBindings = {};
    PortBindings[`${initialRpcPort}/tcp`] = [{ HostPort: initialRpcPort.toString() }];
    PortBindings[`${initialPubPort}/tcp`] = [{ HostPort: initialPubPort.toString() }];

    const EndpointsConfig = {};
    EndpointsConfig['dash_test_network'] = {};

    const docker = new Docker();
    const container = await docker.createContainer({
      Image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      Cmd: [
        'dashd',
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        '-rpcallowip=0.0.0.0/0',
        '-regtest=1',
        `-rpcport=${initialRpcPort}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${initialPubPort}`,
      ],
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
      NetworkingConfig: {
        EndpointsConfig
      },
    });

    try {
      await container.start();
      const { NetworkSettings: { Networks } } = await container.inspect();
      this.containerIp = Networks.dash_test_network.IPAddress;
    } catch (error) {
      this.options = this.createOptions();
      return await this.createContainer(this.options);
    }

    return container;
  }

  async createRpcClient({ port, user, password }) {
    return new RpcClient({
      protocol: 'http',
      host: '127.0.0.1',
      port: port,
      user: user,
      pass: password,
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
      }
    };
  }

  getRandomPort(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

module.exports = DashcoreInstance;
