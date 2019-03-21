/**
 * @param {SVContractMongoDbRepository} svContractRepository
 * @returns {fetchContract}
 */
function fetchContractFactory(svContractRepository) {
  /**
   * Fetch DP Contract by id
   *
   * @typedef fetchContract
   * @param {string} contractId
   * @returns {Promise<DPContract|null>}
   */
  async function fetchContract(contractId) {
    const svContract = await svContractRepository.find(contractId);

    if (!svContract) {
      return null;
    }

    return svContract.getDPContract();
  }

  return fetchContract;
}

module.exports = fetchContractFactory;
