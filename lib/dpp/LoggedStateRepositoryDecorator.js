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
   * @private
   * @param {string} method - state repository method name
   * @param {object} parameters - parameters of the state repository call
   * @param {object} response - response of the state repository call
   */
  writeToDebugLog(method, parameters, response) {
    this.logger.debug({
      method,
      parameters,
      response,
    }, `StateRepository#${method} called`);
  }

  /**
   * Fetch Identity by ID
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    let response;

    try {
      response = await this.stateRepository.fetchIdentity(id);
    } finally {
      this.writeToDebugLog('fetchIdentity', { id }, response);
    }

    return response;
  }

  /**
   * Store identity
   *
   * @param {Identity} identity
   * @returns {Promise<void>}
   */
  async storeIdentity(identity) {
    let response;

    try {
      response = await this.stateRepository.storeIdentity(identity);
    } finally {
      this.writeToDebugLog('storeIdentity', { identity }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository.storePublicKeyIdentityId(publicKeyHash, identityId);
    } finally {
      this.writeToDebugLog('storePublicKeyIdentityId', { publicKeyHash, identityId }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository
        .storeIdentityPublicKeyHashes(identityId, publicKeyHashes);
    } finally {
      this.writeToDebugLog('storeIdentityPublicKeyHashes', { identityId, publicKeyHashes }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository.fetchPublicKeyIdentityId(publicKeyHash);
    } finally {
      this.writeToDebugLog('fetchPublicKeyIdentityId', { publicKeyHash }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository.fetchIdentityIdsByPublicKeyHashes(publicKeyHashes);
    } finally {
      this.writeToDebugLog('fetchIdentityIdsByPublicKeyHashes', { publicKeyHashes }, response);
    }

    return response;
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    let response;

    try {
      response = await this.stateRepository.fetchDataContract(id);
    } finally {
      this.writeToDebugLog('fetchDataContract', { id }, response);
    }

    return response;
  }

  /**
   * Store Data Contract
   *
   * @param {DataContract} dataContract
   * @returns {Promise<void>}
   */
  async storeDataContract(dataContract) {
    let response;

    try {
      response = await this.stateRepository.storeDataContract(dataContract);
    } finally {
      this.writeToDebugLog('storeDataContract', { dataContract }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository.fetchDocuments(contractId, type, options);
    } finally {
      this.writeToDebugLog('fetchDocuments', { contractId, type, options }, response);
    }

    return response;
  }

  /**
   * Store document
   *
   * @param {Document} document
   * @returns {Promise<void>}
   */
  async storeDocument(document) {
    let response;

    try {
      response = await this.stateRepository.storeDocument(document);
    } finally {
      this.writeToDebugLog('storeDocument', { document }, response);
    }

    return response;
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
    let response;

    try {
      response = await this.stateRepository.removeDocument(contractId, type, id);
    } finally {
      this.writeToDebugLog('removeDocument', { contractId, type, id }, response);
    }

    return response;
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async fetchTransaction(id) {
    let response;

    try {
      response = await this.stateRepository.fetchTransaction(id);
    } finally {
      this.writeToDebugLog('fetchTransaction', { id }, response);
    }

    return response;
  }

  /**
   * Fetch latest platform block header
   *
   * @return {Promise<IHeader>}
   */
  async fetchLatestPlatformBlockHeader() {
    let response;

    try {
      response = await this.stateRepository.fetchLatestPlatformBlockHeader();
    } finally {
      this.writeToDebugLog('fetchLatestPlatformBlockHeader', { }, response);
    }

    return response;
  }
}

module.exports = LoggedStateRepositoryDecorator;
