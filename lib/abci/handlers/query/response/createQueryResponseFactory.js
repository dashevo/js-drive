const {
  v0: {
    Proof,
    ResponseMetadata,
  },
} = require('@dashevo/dapi-grpc');

const UnavailableAbciError = require('../../../errors/UnavailableAbciError');

/**
 * @param {BlockExecutionContext} blockExecutionContext
 * @param {BlockExecutionContext} previousBlockExecutionContext
 * @return {createQueryResponse}
 */
function createQueryResponseFactory(
  blockExecutionContext,
  previousBlockExecutionContext,
) {
  /**
   * @typedef {createQueryResponse}
   * @param {Function} ResponseClass
   * @param {boolean} [prove=false]
   */
  function createQueryResponse(ResponseClass, prove = false) {
    if (blockExecutionContext.isEmpty() || previousBlockExecutionContext.isEmpty()) {
      throw new UnavailableAbciError();
    }

    const {
      height: previousBlockHeight,
      coreChainLockedHeight: previousCoreChainLockedHeight,
    } = previousBlockExecutionContext.getHeader();

    const response = new ResponseClass();

    response.setMetadata(new ResponseMetadata({
      height: previousBlockHeight,
      chainLockedCoreHeight: previousCoreChainLockedHeight,
    }));

    if (prove) {
      const {
        quorumHash: signatureLlmqHash,
        signature,
      } = blockExecutionContext.getLastCommitInfo();

      const proof = new Proof({
        signatureLlmqHash,
        signature,
      });

      response.setProof(proof);
    }

    return response;
  }

  return createQueryResponse;
}

module.exports = createQueryResponseFactory;
