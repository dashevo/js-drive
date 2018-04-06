const Docker = require('dockerode');
const RpcClient = require('@dashevo/bitcoind-rpc-dash/promise');
const zmq = require('zeromq');

class DashcoreInstance {
  constructor({ RPC = {}, ZMQ = {} } = {}) {
    const options = {
      RPC: Object.assign({}, DashcoreInstance.DEFAULT_OPTIONS.RPC, RPC),
      ZMQ: Object.assign({}, DashcoreInstance.DEFAULT_OPTIONS.ZMQ, ZMQ),
    };
    this.options = Object.assign({}, options);
    this.container = null;
    this.rpcClient = null;
    this.zmqClient = null;
    this.isInitialized = false;
  }

  async start() {
    if (!this.container) {
      this.container = await this.createContainer(this.options);
    }

    if (this.isInitialized) {
      return;
    }

    await this.container.start();
    this.rpcClient = await this.createRpcClient(this.options.RPC);
    this.zmqClient = await this.createZmqClient(this.options.ZMQ);

    this.isInitialized = true;
  }

  async stop() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();
    this.zmqClient.disconnect(`tcp://127.0.0.1:${this.options.ZMQ.port}`);

    this.isInitialized = false;
  }

  async clean() {
    if (!this.isInitialized) {
      return;
    }

    await this.container.stop();
    await this.container.remove();
    this.zmqClient.disconnect(`tcp://127.0.0.1:${this.options.ZMQ.port}`);

    this.isInitialized = false;
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

    const docker = new Docker();
    const container = await docker.createContainer({
      Image: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      Cmd: [
        'dashd',
        `-rpcuser=${rpcUser}`,
        `-rpcpassword=${rpcPassword}`,
        '-rpcallowip=0.0.0.0/0',
        `-rpcport=${initialRpcPort}`,
        `-zmqpubhashblock=tcp://0.0.0.0:${initialPubPort}`,
      ],
      ExposedPorts,
      HostConfig: {
        PortBindings,
      },
    });

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

  createZmqClient({ port }) {
    const zmqClient = zmq.socket('sub');
    zmqClient.connect(`tcp://127.0.0.1:${port}`);
    zmqClient.subscribe('hashblock');
    zmqClient.on('disconnect', () => {
      console.log('disconnect');
    });
    return zmqClient;
  }
}

DashcoreInstance.DEFAULT_OPTIONS = {
  RPC: {
    port: 20002,
    user: 'dashrpc',
    password: 'password',
  },
  ZMQ: {
    port: 30002,
  }
};

module.exports = DashcoreInstance;
