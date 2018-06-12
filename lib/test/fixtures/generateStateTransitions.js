const Schema = require('@dashevo/dash-schema');
const BitcoreLib = require('@dashevo/dashcore-lib');

const { PrivateKey, PublicKey, Address } = BitcoreLib;
const { TransitionPacket, TransitionHeader } = BitcoreLib.StateTransition;
const { Registration } = BitcoreLib.Transaction.SubscriptionTransactions;

const hashDataMerkleRoot = require('../../../lib/test/consensus/hashDataMerkleRoot');

/**
 * Register user
 * @param {string} username
 * @param {RpcClient} api
 * @returns {Promise<string>}
 */
async function registerUser(username, api) {

  let response = await api.getnewaddress();
  const address = response.result;

  response = await api.dumpprivkey(address);
  const privateKeyString = response.result;

  const privateKey = new PrivateKey(privateKeyString);

  await api.generate(101);
  await api.sendtoaddress(address, 10);
  await api.generate(7);

  response = await api.listunspent();
  const unspent = response.result;
  const inputs = unspent.filter(input => input.address === address);

  const subTx = Registration
	.createRegistration(username, privateKey)
	.fund(inputs, address, 100000)
	.sign(privateKey)
	.serialize();

  response = await api.sendrawtransaction(subTx);

  return {
    userId: response.result,
    privateKeyString,
    address
  };
}

/**
 * Create DAP contract state transaction packet and header
 * @param {string} userId
 * @param {string} privateKeyString
 * @param {object} tsp
 * @returns {Promise<[TansitionPacket, TransitionHeader]>}
 */
async function createDapContractTransitions(userId, privateKeyString, tsp) {

  const privateKey = new PrivateKey(privateKeyString);

  const transitionPacket = new TransitionPacket()
	.addObject(tsp);

  const merkleRoot = await hashDataMerkleRoot(transitionPacket);

  const transitionHeader = new TransitionHeader()
	.setMerkleRoot(merkleRoot)
	.setRegTxHash(userId)
	.sign(privateKey)
	.serialize();

  return [transitionPacket, transitionHeader];
}

module.exports = {
  createDapContractTransitions,
  registerUser
};
