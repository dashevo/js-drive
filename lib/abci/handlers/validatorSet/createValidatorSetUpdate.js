const {
  tendermint: {
    abci: {
      ValidatorUpdate,
      ValidatorSetUpdate,
    },
    crypto: {
      PublicKey,
    },
  },
} = require('@dashevo/abci/types');

/**
 * @typedef {createValidatorSetUpdate}
 * @param {ValidatorSet} validatorSet
 * @return {ValidatorSetUpdate}
 */
function createValidatorSetUpdate(validatorSet) {
  const validatorUpdates = validatorSet.getValidators()
    .map((validator) => (
      new ValidatorUpdate({
        pubKey: new PublicKey({
          // TODO: It doesn't work with Buffer?
          bls12381: Uint8Array.from(validator.getPublicKeyShare()),
        }),
        power: validator.getVotingPower(),
        proTxHash: validator.getProTxHash(),
      })
    ));

  const { quorumPublicKey, quorumHash } = validatorSet.getQuorum();

  return new ValidatorSetUpdate({
    validatorUpdates,
    thresholdPublicKey: new PublicKey({
      bls12381: Buffer.from(quorumPublicKey, 'hex'),
    }),
    quorumHash: Buffer.from(quorumHash, 'hex'),
  });
}

module.exports = createValidatorSetUpdate;
