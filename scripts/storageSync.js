/* eslint-disable no-console */

const zmq = require('zeromq');
const IpfsAPI = require('ipfs-api');
const RpcClient = require('bitcoind-rpc-dash');

const pinSTPacketsByEvents = require('../lib/storage/pinSTPacketsByEvents');
const pinSTPacketsSinceBlock = require('../lib/storage/pinSTPacketsSinceBlock');
const StateTransitionHeaderIterator = require('../lib/blockchain/StateTransitionHeaderIterator');
const BlockIterator = require('../lib/blockchain/BlockIterator');

const ipfsAPI = new IpfsAPI(process.env.STORAGE_IPFS_MULTIADDR);

// Sync ST packets since genesis block
const rpcClient = new RpcClient({
  protocol: 'http',
  host: process.env.DASHCORE_JSON_RPC_HOST,
  port: process.env.DASHCORE_JSON_RPC_PORT,
  user: process.env.DASHCORE_JSON_RPC_USER,
  pass: process.env.DASHCORE_JSON_RPC_PASS,
});
const blockIterator = new BlockIterator(rpcClient, process.env.EVO_GENESIS_BLOCK_HEIGHT);
const stHeaderIterator = new StateTransitionHeaderIterator(blockIterator);

pinSTPacketsSinceBlock(ipfsAPI, stHeaderIterator).catch(e => console.error(e));

// Sync arriving ST packets
const sock = zmq.createSocket('sub');
sock.connect(process.env.DASHCORE_ZMQ_PUB_RAWST);

pinSTPacketsByEvents().catch(e => console.error(e));

