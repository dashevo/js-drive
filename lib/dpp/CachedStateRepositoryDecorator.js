class CachedStateRepositoryDecorator {
  /**
   * @param {DriveStateRepository} stateRepository
   * @param {LRUCache} dataContractCache
   */
  constructor(
    stateRepository,
    dataContractCache,
  ) {
    this.stateRepository = stateRepository;
    this.contractCache = dataContractCache;
  }

  /**
   * Fetch Identity by ID
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    return this.stateRepository.fetchIdentity(id);
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    let dataContract = this.contractCache.get(id);

    if (dataContract !== null) {
      return dataContract;
    }

    dataContract = this.stateRepository.fetchDataContract(id);

    this.contractCache.set(id, dataContract);

    return dataContract;
  }

  /**
   * Fetch Documents by contract ID and type
   *
   * @param {string} contractId
   * @param {string} type
   * @param {{ where: Object }} [options]
   * @returns {Promise<Document[]>}
   */
  async fetchDocuments(contractId, type, options = {}) {
    return this.stateRepository.fetchDocuments(contractId, type, options);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<{ confirmations: number }|null>}
   */
  async fetchTransaction(id) {
    return this.stateRepository.fetchTransaction(id);
  }
}

module.exports = CachedStateRepositoryDecorator;
