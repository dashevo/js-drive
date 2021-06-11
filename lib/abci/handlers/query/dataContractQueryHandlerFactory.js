const {
  tendermint: {
    abci: {
      ResponseQuery,
    },
  },
} = require('@dashevo/abci/types');

const cbor = require('cbor');

const NotFoundAbciError = require('../../errors/NotFoundAbciError');
const UnavailableAbciError = require('../../errors/UnavailableAbciError');

/**
 *
 * @param {DataContractStoreRepository} previousDataContractRepository
 * @param {RootTree} previousRootTree
 * @param {DataContractsStoreRootTreeLeaf} previousDataContractsStoreRootTreeLeaf
 * @param {BlockExecutionContext} previousBlockExecutionContext
 * @param {BlockExecutionContext} blockExecutionContext
 * @return {dataContractQueryHandler}
 */
function dataContractQueryHandlerFactory(
  previousDataContractRepository,
  previousRootTree,
  previousDataContractsStoreRootTreeLeaf,
  previousBlockExecutionContext,
  blockExecutionContext,
) {
  /**
   * @typedef dataContractQueryHandler
   * @param {Object} params
   * @param {Object} data
   * @param {Buffer} data.id
   * @param {Object} request
   * @param {boolean} [request.prove]
   * @return {Promise<ResponseQuery>}
   */
  async function dataContractQueryHandler(params, { id }, request) {
    const dataContract = await previousDataContractRepository.fetch(id);

    if (!dataContract) {
      throw new NotFoundAbciError('Data Contract not found');
    }

    const {
      quorumHash,
      signature,
    } = blockExecutionContext.getLastCommitInfo();

    if (!previousBlockExecutionContext) {
      throw new UnavailableAbciError();
    }

    const {
      height: blockHeight,
      coreChainLockedHeight,
    } = previousBlockExecutionContext.getHeader();

    const value = {
      metadata: {
        height: blockHeight,
        chain_locked_core_height: coreChainLockedHeight,
      },
    };

    if (!!blockHeight || !!coreChainLockedHeight
        || !!quorumHash || !!signature) {
      throw new UnavailableAbciError();
    }

    const includeProof = request.prove === 'true';

    if (includeProof) {
      value.proof = {
        quorum_hash: quorumHash,
        signature,
        ...previousRootTree.getFullProof(previousDataContractsStoreRootTreeLeaf, [id]),
      };
    } else {
      value.data = dataContract.toBuffer();
    }

    return new ResponseQuery({
      value: cbor.encode(value),
    });
  }

  return dataContractQueryHandler;
}

module.exports = dataContractQueryHandlerFactory;
