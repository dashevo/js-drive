const SVContract = require('./SVContract');

/**
 * @param {SVContractMongoDbRepository} svContractRepository
 * @returns {updateSVContract}
 */
function updateSVContractFactory(svContractRepository) {
  /**
   * Generate Contract State View
   *
   * @typedef {Promise} updateSVContract
   * @param {DataContract} contract
   * @param {Reference} reference
   * @param {MongoDBTransaction} [transaction]
   *
   * @returns {Promise<SVContract>}
   */
  async function updateSVContract(
    contract,
    reference,
    transaction = undefined,
  ) {
    const currentSVContract = new SVContract(
      contract,
      reference,
    );

    const previousSVContract = await svContractRepository.find(
      contract.getId(),
      transaction,
    );

    if (previousSVContract) {
      currentSVContract.addRevision(previousSVContract);
    }

    await svContractRepository.store(currentSVContract, transaction);

    return currentSVContract;
  }

  return updateSVContract;
}

module.exports = updateSVContractFactory;
