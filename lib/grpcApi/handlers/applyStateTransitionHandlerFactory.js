const { ApplyStateTransitionResponse } = require('@dashevo/drive-grpc');
const InvalidSTPacketError = require('@dashevo/dpp/lib/stPacket/errors/InvalidSTPacketError');

const StateTransition = require('../../blockchain/StateTransition');
const InvalidArgumentGrpcError = require('../error/InvalidArgumentGrpcError');
const InternalGrpcError = require('../error/InternalGrpcError');

/**
 * @param {MongoDBTransaction} stateViewTransaction
 * @param {DashPlatformProtocol} dpp
 * @param {applyStateTransition} applyStateTransition
 * @returns {applyStateTransitionHandler}
 */
module.exports = function applyStateTransitionHandlerFactory(
  stateViewTransaction,
  dpp,
  applyStateTransition,
) {
  /**
   * Apply received stPacket and stHeader to database inside transaction, opened earlier
   *
   * @typedef applyStateTransitionHandler
   * @param {Object} call
   * @returns {Promise<CommitTransactionResponse>}
   */
  async function applyStateTransitionHandler(call) {
    const { request } = call;

    const blockHeight = request.getBlockHeight();
    const blockHash = request.getBlockHash();
    const stPacketBinary = request.getStateTransitionPacket();
    const stHeaderBinary = request.getStateTransitionHeader();

    if (!stPacketBinary) {
      throw new InvalidArgumentGrpcError('stateTransitionPacket is not specified');
    }

    if (!stHeaderBinary) {
      throw new InvalidArgumentGrpcError('stateTransitionHeader is not specified');
    }

    if (!blockHeight) {
      throw new InvalidArgumentGrpcError('blockHeight is not specified');
    }

    if (!blockHash) {
      throw new InvalidArgumentGrpcError('blockHash is not specified');
    }

    let stPacket;

    try {
      stPacket = await dpp.packet.createFromSerialized(stPacketBinary.toString('hex'));
    } catch (e) {
      if (e instanceof InvalidSTPacketError) {
        throw new InvalidArgumentGrpcError(`Invalid "stateTransitionPacket" param: ${e.message}`);
      }

      throw e;
    }

    let stHeader;

    try {
      stHeader = new StateTransition(stHeaderBinary.toString('hex'));
    } catch (e) {
      throw new InvalidArgumentGrpcError(`Invalid "stateTransitionHeader" param: ${e.message}`);
    }

    const result = await dpp.packet.verify(stPacket, stHeader);
    if (!result.isValid()) {
      throw new InvalidArgumentGrpcError(`Invalid "stPacket" and "stateTransition" params: ${result.getErrors()}`);
    }

    try {
      await applyStateTransition(stPacket, stHeader, blockHash, blockHeight, stateViewTransaction);
    } catch (error) {
      throw new InternalGrpcError(error);
    }


    return new ApplyStateTransitionResponse();
  }

  return applyStateTransitionHandler;
};
