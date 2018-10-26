const StateTransitionHeader = require('./StateTransitionHeader');

/**
 * @param {RpcClient} rpcClient
 * @return {createStateTransitionsFromBlock}
 */
module.exports = function createStateTransitionsFromBlockFactory(rpcClient) {
  /**
   * @typedef createStateTransitionsFromBlock
   * @param {object} block
   * @return {StateTransitionHeader[]}
   */
  async function createStateTransitionsFromBlock(block) {
    const stateTransitions = [];

    for (const transactionId of block.tx) {
      const { result: serializedTransaction } = await rpcClient.getRawTransaction(transactionId);

      const stateTransition = new StateTransitionHeader(serializedTransaction);

      if (stateTransition.type === StateTransitionHeader.TYPES.TRANSACTION_SUBTX_TRANSITION) {
        stateTransitions.push(stateTransition);
      }
    }

    return stateTransitions;
  }

  return createStateTransitionsFromBlock;
};
