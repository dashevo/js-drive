const Schema = require('@dashevo/dash-schema');
const BitcoreLib = require('@dashevo/dashcore-lib');

const { PrivateKey, PublicKey, Address } = BitcoreLib;
const { TransitionPacket, TransitionHeader } = BitcoreLib.StateTransition;
const { Registration } = BitcoreLib.Transaction.SubscriptionTransactions;

/**
 * Get private key string from address (generates new address)
 * @param {RpcClient} api
 * @returns {Promise<string>}
 */
async function getPrivateKeyString(api) {
  let { result } = await api.getnewaddress();
  const address = result;

  ({ result } = await api.dumpprivkey(address));
  const privateKeyString = result;

  return privateKeyString;
}

/**
 * Register user
 * @param {string} username
 * @param {string} privateKeyString
 * @param {RpcClient} api
 * @returns {Promise<string>}
 */
async function registerUser(username, privateKeyString, api) {
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  const address = Address
    .fromPublicKey(publicKey, 'testnet')
    .toString();

  // const addressesJson = {
  //   'addresses': [
  //     address
  //   ]
  // };

  // const inputs = await api.getaddressutxos(addressesJson);
  const inputs = []; // TODO: use actual inputs

  // console.log(inputs);

  // if (!inputs.length) {
  //   throw new Error('No inputs!');
  // }

  const subTx = Registration.createRegistration(username, privateKey);
  // Must be bigger than dust amount
  const fundingInDuffs = 1000 * 1000; // 0.01 Dash

  const balance = await api.getBalance(address);

  if (balance < fundingInDuffs) {
    throw new Error('Insufficient funds');
  }

  subTx.fund(inputs, address, fundingInDuffs);
  subTx.sign(privateKey);

  // Send registration transaction to the network
  return api.sendRawTransaction(subTx.serialize());
}

/**
 * Create DAP contract state transaction packet and header
 * @param {Schema} dapSchema
 * @param {string} privateKeyString
 * @param {string} userId
 * @returns {Promise<[TansitionPacket, TransitionHeader]>}
 */
async function createDapContractTransitions(dapSchema, privateKeyString, userId) {
  const privateKey = new PrivateKey(privateKeyString);

  const dapContract = Schema.create.dapcontract(dapSchema);

  // create a packet
  const tsp = Schema.create.tspacket();
  tsp.tspacket.dapcontract = dapContract.dapcontract;
  tsp.tspacket.dapid = dapContract.dapcontract.meta.dapid;
  Schema.object.setID(tsp);

  const validTsp = Schema.object.validate(tsp);
  if (!validTsp.valid) {
    throw new Error('Packet is not valid.');
  }

  const transitionPacket = new TransitionPacket()
    .addObject(tsp);

  const transitionHeader = new TransitionHeader()
    .setMerkleRoot(transitionPacket.getMerkleRoot().toString('hex'))
    .setRegTxHash(userId)
    .sign(privateKey)
    .serialize();

  return [transitionPacket, transitionHeader];
}

/**
 * Register user, and generate DAP contract state transitions for it
 * @param {string} username
 * @param {RpcClient} api
 * @returns {Promise<[TransitionPacket, TransitionHeader]>}
 */
async function dapContractTransitions(username, api) {
  // TODO: check if user already registered?

  const privateKeyString = await getPrivateKeyString(api);

  await registerUser(username, privateKeyString, api);

  const blockchainUser = await api.getUser(username);

  const transitions = await createDapContractTransitions(
    Schema.Daps.DashPay,
    privateKeyString,
    blockchainUser.regtxid,
  );

  return transitions;
}

module.exports = {
  dapContractTransitions,
};
