const { EventEmitter } = require('events');
const zeromq = require('zeromq');

class ZMQClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.protocol = options.protocol || 'tcp';
    this.host = options.host || '0.0.0.0';
    this.port = options.port || '29998';
  }

  async connect() {
    if (this.socket) { this.disconnect(); }
    this.socket = new zeromq.Subscriber();
    this.socket.connect(`${this.protocol}://${this.host}:${this.port}`);
    for await (const [rawTopic, rawMsg] of this.socket) {
      const topic = rawTopic.toString('utf-8');
      const message = rawMsg.toString('hex');
      this.emit(topic, message);
    }
  }

  disconnect() {
    this.socket = null;
  }

  subscribe(roomName) {
    if (!Object.keys(ZMQClient.ROOMS).includes(roomName)) {
      throw new Error('Invalid roomName');
    }
    this.socket.subscribe(roomName);
  }
}

ZMQClient.ROOMS = {
  hashblock: 'hashblock',
  hashchainlock: 'hashchainlock',
  hashtx: 'hashtx',
  hashtxlock: 'hashtxlock',
  hashgovernancevote: 'hashgovernancevote',
  hashgovernanceobject: 'hashgovernanceobject',
  hashinstantsenddoublespend: 'hashinstantsenddoublespend',
  rawblock: 'rawblock',
  rawchainlock: 'rawchainlock',
  rawchainlocksig: 'rawchainlocksig',
  rawtx: 'rawtx',
  rawtxlock: 'rawtxlock',
  rawtxlocksig: 'rawtxlocksig',
  rawgovernancevote: 'rawgovernancevote',
  rawgovernanceobject: 'rawgovernanceobject',
  rawinstantsenddoublespend: 'rawinstantsenddoublespend',
};

module.exports = ZMQClient;
