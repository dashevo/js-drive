const {
  PrivateKey,
  PublicKey,
  Transaction,
} = require('@dashevo/dashcore-lib');

const IdentityPublicKey = require(
  '@dashevo/dpp/lib/identity/IdentityPublicKey',
);
const stateTransitionTypes = require(
  '@dashevo/dpp/lib/stateTransition/stateTransitionTypes',
);

const wait = require('../../lib/util/wait');

/**
 * Register user
 *
 * @param {RpcClient} coreAPI
 * @param {DapiClient} dapiClient
 * @param {DashPlatformProtocol} dpp
 *
 * @returns {Promise<{ identityId: string, identityPrivateKey: PrivateKey }>}
 */
async function registerUser(coreAPI, dapiClient, dpp) {
  let response = await coreAPI.getnewaddress();
  const address = response.result;

  response = await coreAPI.dumpprivkey(address);
  const privateKeyString = response.result;

  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = PublicKey.fromPrivateKey(privateKey);
  // eslint-disable-next-line no-underscore-dangle
  const publicKeyHash = publicKey._getId();

  await coreAPI.generate(101);
  await coreAPI.sendtoaddress(address, 10);
  await coreAPI.generate(7);

  response = await coreAPI.listunspent();
  const unspent = response.result;
  const inputs = unspent.filter(input => input.address === address);

  const transaction = new Transaction();

  transaction.from(inputs)
    .addBurnOutput(10000, publicKeyHash)
    .sign(privateKey);

  await coreAPI.sendrawtransaction(transaction.serialize());

  const outPoint = transaction.getOutPointBuffer(0)
    .toString('base64');

  const identityPrivateKey = new PrivateKey();

  const identityCreateTransition = dpp.stateTransition.createFromObject({
    protocolVersion: 0,
    type: stateTransitionTypes.IDENTITY_CREATE,
    lockedOutPoint: outPoint,
    publicKeys: [
      {
        id: 0,
        type: IdentityPublicKey.TYPES.ECDSA_SECP256K1,
        data: PublicKey.fromPrivateKey(identityPrivateKey).toString(),
        isEnabled: true,
      },
    ],
  });

  const validationResult = dpp.stateTransition.validateData(identityCreateTransition);
  if (!validationResult.isValid()) {
    throw new Error('Invalid identity create state transition');
  }

  await dapiClient.updateState(identityCreateTransition);

  await wait(3000); // wait a couple of seconds for tx to be confirmed

  return {
    identityId: identityCreateTransition.getIdentityId(),
    identityPrivateKey,
  };
}

module.exports = registerUser;
