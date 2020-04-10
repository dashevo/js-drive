class CachedStateRepositoryDecorator {
  /**
   * @param {DriveStateRepository} stateRepository
   * @param {LRUCache} dataContractCache
   * @param {LRUCache} identityCache
   */
  constructor(
    stateRepository,
    dataContractCache,
    identityCache,
  ) {
    this.stateRepository = stateRepository;
    this.contractCache = dataContractCache;
    this.identityCache = identityCache;
  }

  /**
   * Fetch Identity by ID
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    let identity = this.identityCache.get(id);

    if (identity !== undefined) {
      return identity;
    }

    identity = await this.stateRepository.fetchIdentity(id);

    if (identity !== null) {
      this.identityCache.set(id, identity);
    }

    return identity;
  }

  /**
   * Store identity
   *
   * @param {Identity} identity
   * @returns {Promise<void>}
   */
  async storeIdentity(identity) {
    return this.stateRepository.storeIdentity(identity);
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    let dataContract = this.contractCache.get(id);

    if (dataContract !== undefined) {
      return dataContract;
    }

    dataContract = await this.stateRepository.fetchDataContract(id);

    if (dataContract !== null) {
      this.contractCache.set(id, dataContract);
    }

    return dataContract;
  }

  /**
   * Store Data Contract
   *
   * @param {DataContract} dataContract
   * @returns {Promise<void>}
   */
  async storeDataContract(dataContract) {
    return this.stateRepository.storeDataContract(dataContract);
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
   * Store document
   *
   * @param {Document} document
   * @returns {Promise<void>}
   */
  async storeDocument(document) {
    return this.stateRepository.storeDocument(document);
  }

  /**
   * Remove document
   *
   * @param {string} contractId
   * @param {string} type
   * @param {string} id
   * @returns {Promise<void>}
   */
  async removeDocument(contractId, type, id) {
    return this.stateRepository.removeDocument(contractId, type, id);
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
