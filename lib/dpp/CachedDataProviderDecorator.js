class CachedDataProviderDecorator {
  /**
   * @param {DriveDataProvider} dataProvider
   * @param {LRUCache} dataContractCache
   */
  constructor(
    dataProvider,
    dataContractCache,
  ) {
    this.dataProvider = dataProvider;
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
    return this.dataProvider.fetchIdentity(id);
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

    dataContract = this.dataProvider.fetchDataContract(id);

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
    return this.dataProvider.fetchDocuments(contractId, type, options);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<{ confirmations: number }|null>}
   */
  async fetchTransaction(id) {
    return this.dataProvider.fetchTransaction(id);
  }
}

module.exports = CachedDataProviderDecorator;
