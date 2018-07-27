const BitcoreLib = require('@dashevo/dashcore-lib');

const { PrivateKey, Transaction } = BitcoreLib;

/**
 * Register user
 * @param {string} username
 * @param {RpcClient} api
 * @returns {Promise<object>}
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

  const subTx = new Transaction();
  subTx.setSpecialTransactionType(Transaction.TYPES.TRANSACTION_SUBTX_TRANSITION);

  subTx.extraPayload.setUserName(username)
    .sign(privateKey);

  // TODO Wait for new SubTransaction class
  subTx.fund(inputs, address, 100000)
    .sign(privateKey);

  response = await api.sendrawtransaction(subTx.serialize());

  return {
    userId: response.result,
    privateKeyString,
    address,
  };
}

module.exports = registerUser;
