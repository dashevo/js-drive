const BitcoreLib = require('@dashevo/dashcore-lib');

const { PrivateKey, Transaction } = BitcoreLib;

/**
 * Register user
 * @param {string} userName
 * @param {RpcClient} api
 * @returns {Promise<{ userId: string, privateKeyString: string, address: string }>}
 */
async function registerUser(userName, api) {
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

  const extraPayload = Transaction.Payload.SubTxRegisterPayload.fromJSON({
    nVersion: 1,
    userName,
    // eslint-disable-next-line no-underscore-dangle
    pubKeyId: privateKey.toPublicKey()._getID(),
    vchSig: '00',
  });

  extraPayload.sign(privateKey);

  const transaction = new Transaction();

  transaction.setType(Transaction.TYPES.TRANSACTION_SUBTX_REGISTER)
    .setExtraPayload(extraPayload)
    .from(inputs)
    .change(address)
    .addFundingOutput(10000);

  transaction.sign(privateKey);

  const { result: userId } = await api.sendrawtransaction(transaction.serialize());

  return {
    userId,
    privateKeyString,
    address,
  };
}

module.exports = registerUser;
