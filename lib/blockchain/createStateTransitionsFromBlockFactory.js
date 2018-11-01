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

      const transaction = new StateTransitionHeader(serializedTransaction);

      if (transaction.isSpecialTransaction()
          && transaction.type === StateTransitionHeader.TYPES.TRANSACTION_SUBTX_TRANSITION) {
        stateTransitions.push(transaction);
      }
    }

    // Group transitions by `regTxId` first
    const regTxIdGroupedTransitions = stateTransitions.reduce((accumulator, transition) => ({
      ...accumulator,
      [transition.regTxId]: [
        ...(accumulator[transition.regTxId] || []),
        transition,
      ],
    }), {});

    // Then sort transitions in increasing order using `hashPrevSubTx`
    // Result should be flattened list of state transitions
    return Object.entries(regTxIdGroupedTransitions)
      .flatMap(([, group]) => {
        const result = [];

        for (const transition of group) {
          // TODO: implement a proper sorting
        }

        return result;
      });
  }

  return createStateTransitionsFromBlock;
};
