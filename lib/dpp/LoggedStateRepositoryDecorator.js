class LoggedStateRepositoryDecorator {
  /**
   * @param {DriveStateRepository} stateRepository
   * @param {BaseLogger} logger
   */
  constructor(
    stateRepository,
    logger,
  ) {
    this.stateRepository = stateRepository;
    this.logger = logger;
  }

  /**
   *
   * @param {string} method - state repository method name
   * @param {object} parameters - parameters of the state repository call
   */
  writeToDebugLog(method, parameters) {
    this.logger.debug({
      stateRepositoryQuery: {
        method,
        parameters,
      },
    });
  }

  /**
   * Fetch Identity by ID
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    this.writeToDebugLog('fetchIdentity', { id });

    return this.stateRepository.fetchIdentity(id);
  }

  /**
   * Store identity
   *
   * @param {Identity} identity
   * @returns {Promise<void>}
   */
  async storeIdentity(identity) {
    this.writeToDebugLog('storeIdentity', { identity });

    return this.stateRepository.storeIdentity(identity);
  }

  /**
   * Store public key hash and identity id pair
   *
   * @deprecated
   *
   * @param {string} publicKeyHash
   * @param {string} identityId
   *
   * @returns {Promise<void>}
   */
  async storePublicKeyIdentityId(publicKeyHash, identityId) {
    this.writeToDebugLog('storePublicKeyIdentityId', { publicKeyHash, identityId });

    return this.stateRepository.storePublicKeyIdentityId(publicKeyHash, identityId);
  }

  /**
   * Store public key hashes for an identity id
   *
   * @param {string} identityId
   * @param {string[]} publicKeyHashes
   *
   * @returns {Promise<void>}
   */
  async storeIdentityPublicKeyHashes(identityId, publicKeyHashes) {
    this.writeToDebugLog('storeIdentityPublicKeyHashes', { identityId, publicKeyHashes });

    return this.stateRepository.storeIdentityPublicKeyHashes(identityId, publicKeyHashes);
  }

  /**
   * Fetch identity id by public key hash
   *
   * @deprecated
   *
   * @param {string} publicKeyHash
   *
   * @returns {Promise<null|string>}
   */
  async fetchPublicKeyIdentityId(publicKeyHash) {
    this.writeToDebugLog('fetchPublicKeyIdentityId', { publicKeyHash });

    return this.stateRepository.fetchPublicKeyIdentityId(publicKeyHash);
  }

  /**
   * Fetch identity ids mapped by related public keys
   * using public key hashes
   *
   * @param {string[]} publicKeyHashes
   *
   * @returns {Promise<Object>}
   */
  async fetchIdentityIdsByPublicKeyHashes(publicKeyHashes) {
    this.writeToDebugLog('fetchIdentityIdsByPublicKeyHashes', { publicKeyHashes });

    return this.stateRepository.fetchIdentityIdsByPublicKeyHashes(publicKeyHashes);
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    this.writeToDebugLog('fetchDataContract', { id });

    return this.stateRepository.fetchDataContract(id);
  }

  /**
   * Store Data Contract
   *
   * @param {DataContract} dataContract
   * @returns {Promise<void>}
   */
  async storeDataContract(dataContract) {
    this.writeToDebugLog('storeDataContract', { dataContract });

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
    this.writeToDebugLog('fetchDocuments', { contractId, type, options });

    return this.stateRepository.fetchDocuments(contractId, type, options);
  }

  /**
   * Store document
   *
   * @param {Document} document
   * @returns {Promise<void>}
   */
  async storeDocument(document) {
    this.writeToDebugLog('storeDocument', { document });

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
    this.writeToDebugLog('removeDocument', { contractId, type, id });

    return this.stateRepository.removeDocument(contractId, type, id);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async fetchTransaction(id) {
    this.writeToDebugLog('fetchTransaction', { id });

    return this.stateRepository.fetchTransaction(id);
  }

  /**
   * Fetch latest platform block header
   *
   * @return {Promise<IHeader>}
   */
  async fetchLatestPlatformBlockHeader() {
    this.writeToDebugLog('fetchLatestPlatformBlockHeader', {});

    return this.stateRepository.fetchLatestPlatformBlockHeader();
  }
}

module.exports = LoggedStateRepositoryDecorator;
