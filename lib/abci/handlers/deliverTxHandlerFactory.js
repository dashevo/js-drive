const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');

const stateTransitionTypes = require('@dashevo/dpp/lib/stateTransition/stateTransitionTypes');
const AbstractDocumentTransition = require(
  '@dashevo/dpp/lib/document/stateTransition/documentTransition/AbstractDocumentTransition',
);

const InvalidArgumentAbciError = require('../errors/InvalidArgumentAbciError');

const DOCUMENT_ACTION_DESCRIPTONS = {
  [AbstractDocumentTransition.ACTIONS.CREATE]: 'Created',
  [AbstractDocumentTransition.ACTIONS.REPLACE]: 'Replaced',
  [AbstractDocumentTransition.ACTIONS.DELETE]: 'Deleted',
};

/**
 * @param {unserializeStateTransition} transactionalUnserializeStateTransition
 * @param {DashPlatformProtocol} transactionalDpp
 * @param {BlockExecutionState} blockExecutionState
 * @param {Object} logger
 *
 * @return {deliverTxHandler}
 */
function deliverTxHandlerFactory(
  transactionalUnserializeStateTransition,
  transactionalDpp,
  blockExecutionState,
  logger,
) {
  /**
   * DeliverTx ABCI handler
   *
   * @typedef deliverTxHandler
   *
   * @param {abci.RequestDeliverTx} request
   * @return {Promise<abci.ResponseDeliverTx>}
   */
  async function deliverTxHandler({ tx: stateTransitionByteArray }) {
    const stHex = Buffer.from(stateTransitionByteArray).toString('hex');

    logger.debug(`Delivering state transition ${stHex}`);

    const stateTransition = await transactionalUnserializeStateTransition(stateTransitionByteArray);

    const result = await transactionalDpp.stateTransition.validateData(stateTransition);

    if (!result.isValid()) {
      throw new InvalidArgumentAbciError('Invalid state transition', { errors: result.getErrors() });
    }

    await transactionalDpp.stateTransition.apply(stateTransition);

    switch (stateTransition.getType()) {
      case stateTransitionTypes.DATA_CONTRACT_CREATE: {
        const dataContract = stateTransition.getDataContract();

        // Save data contracts in order to create databases for documents on block commit
        blockExecutionState.addDataContract(dataContract);

        logger.debug(`Created data contract with id: ${dataContract.getId()}`);

        break;
      }
      case stateTransitionTypes.IDENTITY_CREATE: {
        const identityId = stateTransition.getIdentityId();
        logger.debug(`Created identity with id: ${identityId}`);
        break;
      }
      case stateTransitionTypes.DOCUMENTS_BATCH: {
        stateTransition.getTransitions().forEach((transition) => {
          const description = DOCUMENT_ACTION_DESCRIPTONS[transition.getAction()];
          logger.debug(`${description} document with id: ${transition.getId()}`);
        });
        break;
      }
      default:
        break;
    }

    // Reduce an identity balance and accumulate fees for all STs in the block
    // in order to store them in credits distribution pool
    const stateTransitionFee = stateTransition.calculateFee();

    const identity = await transactionalDpp.getStateRepository().fetchIdentity(
      stateTransition.getOwnerId(),
    );

    identity.reduceBalance(stateTransitionFee);

    await transactionalDpp.getStateRepository().storeIdentity(identity);

    blockExecutionState.incrementAccumulativeFees(stateTransitionFee);

    return new ResponseDeliverTx();
  }

  return deliverTxHandler;
}

module.exports = deliverTxHandlerFactory;
