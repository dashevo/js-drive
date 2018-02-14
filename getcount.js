/* eslint-disable no-console */

const util = require('util');
const RpcClient = require('bitcoind-rpc-dash');

const client = new RpcClient({
  protocol: 'http',
  user: 'dashrpc',
  pass: 'password',
});

const getBlockCount = util.promisify(client.getBlockCount).bind(client);

async function main() {
  const response = await getBlockCount();

  console.log('The current block count is: %d', response.result);
}

main().catch(e => console.error(e));
