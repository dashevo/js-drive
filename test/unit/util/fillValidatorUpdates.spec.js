const {
  tendermint: {
    abci: {
      ValidatorUpdate,
    },
  },
} = require('@dashevo/abci/types');
const fillValidatorUpdates = require('../../../lib/util/fillValidatorUpdates');

describe('fillValidatorUpdates', () => {
let validatorsFixture;

  beforeEach(() => {
    validatorsFixture = [
      { proTxHash: 'c286807d463b06c7aba3b9a60acf64c1fc03da8c1422005cd9b4293f08cf0562',
        pubKeyOperator: '06abc1c890c9da4e513d52f20da1882228bfa2db4bb29cbd064e1b2a61d9dcdadcf0784fd1371338c8ad1bf323d87ae6',
        valid: true },
      { proTxHash: 'a3e1edc6bd352eeaf0ae58e30781ef4b127854241a3fe7fddf36d5b7e1dc2b3f',
        pubKeyOperator: '04d748ba0efeb7a8f8548e0c22b4c188c293a19837a1c5440649279ba73ead0c62ac1e840050a10a35e0ae05659d2a8d',
        valid: true },
    ];
  });

  it('should fill validator updates', () => {
    const validatorUpdates = fillValidatorUpdates(validatorsFixture);
    expect(validatorUpdates).to.be.an('array');
    expect(validatorUpdates[0]).to.be.an.instanceOf(ValidatorUpdate);
  });
});
