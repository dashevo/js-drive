const zmq = require('zeromq');
const ipfsAPI = require('../lib/storage/ipfs/ipfsApi');

const TransitionHeader = require('../lib/blockchain/StateTransitionHeader');
const addSTPacketByHeader = require('../lib/storage/addSTPacketByHeader');

const sock = zmq.socket('sub');

sock.on('message', async (topic, message) => {
  await addSTPacketByHeader(ipfsAPI, new TransitionHeader(message));
});
sock.connect(process.env.DASHCORE_ZMQ_PUB_RAWST);
sock.subscribe('zmqpubrawst');
