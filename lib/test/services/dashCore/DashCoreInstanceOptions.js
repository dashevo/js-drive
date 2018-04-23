const Options = require('../docker/Options');

class DashCoreInstanceOptions extends Options {
  constructor() {
    super();

    this.image = {
      name: '103738324493.dkr.ecr.us-west-2.amazonaws.com/dashevo/dashcore:develop',
      authorization: true,
    };
    this.ports = {
      MAIN_PORT: this.getRandomPort(20002, 29998),
      RPC: this.getRandomPort(30002, 39998),
      ZMQ: this.getRandomPort(40002, 49998),
    };
    this.rpc = {
      user: 'dashrpc',
      password: 'password',
    };
    this.cmd = [
      'dashd',
      `-port=${this.ports.MAIN_PORT}`,
      `-rpcuser=${this.rpc.user}`,
      `-rpcpassword=${this.rpc.password}`,
      '-rpcallowip=0.0.0.0/0',
      '-regtest=1',
      `-rpcport=${this.ports.RPC}`,
      `-zmqpubhashblock=tcp://0.0.0.0:${this.ports.ZMQ}`,
    ];
    this.network = {
      name: 'dash_test_network',
      driver: 'bridge',
    };
  }

  getOptions() {
    this.ports = {
      MAIN_PORT: this.getRandomPort(20002, 29998),
      RPC: this.getRandomPort(30002, 39998),
      ZMQ: this.getRandomPort(40002, 49998),
    };
    this.cmd = [
      'dashd',
      `-port=${this.ports.MAIN_PORT}`,
      `-rpcuser=${this.rpc.user}`,
      `-rpcpassword=${this.rpc.password}`,
      '-rpcallowip=0.0.0.0/0',
      '-regtest=1',
      `-rpcport=${this.ports.RPC}`,
      `-zmqpubhashblock=tcp://0.0.0.0:${this.ports.ZMQ}`,
    ];
    return this;
  }

  getRpcPort() {
    return this.ports.RPC;
  }

  getRpcPassword() {
    return this.rpc.password;
  }

  getRpcUser() {
    return this.rpc.user;
  }

  getZmqPort() {
    return this.ports.ZMQ;
  }
}

module.exports = DashCoreInstanceOptions;
