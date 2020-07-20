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
  [AbstractDocumentTransition.ACTIONS.CREATE]: 'created',
  [AbstractDocumentTransition.ACTIONS.REPLACE]: 'replaced',
  [AbstractDocumentTransition.ACTIONS.DELETE]: 'deleted',
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
    const { height: blockHeight } = blockExecutionState.getHeader();

    const stateTransition = await transactionalUnserializeStateTransition(stateTransitionByteArray);

    logger.debug(`Deliver state transition ${stateTransition.hash()} from block #${blockHeight}`);

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

        logger.debug(`Data contract created with id: ${dataContract.getId()}`);

        break;
      }
      case stateTransitionTypes.IDENTITY_CREATE: {
        const identityId = stateTransition.getIdentityId();
        logger.debug(`Identity created with id: ${identityId}`);
        break;
      }
      case stateTransitionTypes.DOCUMENTS_BATCH: {
        stateTransition.getTransitions().forEach((transition) => {
          const description = DOCUMENT_ACTION_DESCRIPTONS[transition.getAction()];
          logger.debug(`Document ${description} with id: ${transition.getId()}`);
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
