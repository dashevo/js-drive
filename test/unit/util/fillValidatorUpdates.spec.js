const fillValidatorUpdates = require('../../../lib/util/fillValidatorUpdates');

describe('fillValidatorUpdates', () => {
let validators;

  beforeEach(() => {
    validators = [];
  });

  it('should fill validator updates', () => {
    const validatorUpdates = fillValidatorUpdates(validators);
    expect(validatorUpdates).to.equal(validatorUpdates);
  });
});
