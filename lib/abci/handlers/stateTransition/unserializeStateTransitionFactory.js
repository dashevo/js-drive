const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');
const BalanceIsNotEnoughError = require('@dashevo/dpp/lib/errors/BalanceIsNotEnoughError');

const InvalidArgumentAbciError = require('../../errors/InvalidArgumentAbciError');
const MemoryLimitExceededError = require('../../errors/MemoryLimitExceededError');
const ExecutionTimedOutError = require('../../errors/ExecutionTimedOutError');
const InsufficientFundsError = require('../../errors/InsufficientFundsError');

/**
 * @param {DashPlatformProtocol} dpp
 * @return {unserializeStateTransition}
 */
function unserializeStateTransitionFactory(dpp) {
  /**
   * @typedef unserializeStateTransition
   * @param {Uint8Array} stateTransitionByteArray
   * @return {DocumentsBatchTransition|DataContractCreateTransition|IdentityCreateTransition}
   */
  async function unserializeStateTransition(stateTransitionByteArray) {
    if (!stateTransitionByteArray) {
      throw new InvalidArgumentAbciError('State Transition is not specified');
    }

    const stateTransitionSerialized = Buffer.from(stateTransitionByteArray);

    let stateTransition;
    try {
      stateTransition = await dpp
        .stateTransition
        .createFromBuffer(stateTransitionSerialized);
    } catch (e) {
      if (e instanceof InvalidStateTransitionError) {
        throw new InvalidArgumentAbciError('State Transition is invalid', { errors: e.getErrors() });
      }

      throw e;
    }

    const result = await dpp.stateTransition.validateFee(stateTransition);

    if (!result.isValid()) {
      const errors = result.getErrors();
      if (errors.length === 1 && errors[0] instanceof BalanceIsNotEnoughError) {
        throw new InsufficientFundsError(errors[0].getBalance());
      } else {
        throw new InvalidArgumentAbciError('State Transition is invalid', { errors: result.getErrors() });
      }
    }

    return stateTransition;
  }

  return unserializeStateTransition;
}

module.exports = unserializeStateTransitionFactory;
