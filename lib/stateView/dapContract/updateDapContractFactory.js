const DapContract = require('./DapContract');

/**
 * @param {DapContractMongoDbRepository} dapContractRepository
 * @returns {updateDapContract}
 */
function updateDapContractFactory(dapContractRepository) {
  /**
   * Generate DAP contract State View
   *
   * @typedef {Promise} updateDapContract
   * @param {string} dapId
   * @param {Reference} reference
   * @param {object} dapContractData
   * @returns {Promise<void>}
   */
  async function updateDapContract(dapId, reference, dapContractData) {
    const {
      dapname,
      upgradedapid,
      dapver,
      dapschema,
    } = dapContractData;
    const dapContract = new DapContract(
      dapId,
      dapname,
      reference,
      dapschema,
      dapver,
    );

    if (!upgradedapid) {
      return dapContractRepository.store(dapContract);
    }

    const previousDapContract = await dapContractRepository.find(upgradedapid);
    dapContract.addRevision(previousDapContract);
    await dapContractRepository.delete(previousDapContract);
    return dapContractRepository.store(dapContract);
  }

  return updateDapContract;
}

module.exports = updateDapContractFactory;
