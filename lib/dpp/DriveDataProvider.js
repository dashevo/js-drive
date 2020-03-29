class DriveDataProvider {
  /**
   * @param {IdentityLevelDBRepository} identityRepository
   * @param {DataContractLevelDBRepository} dataContractRepository
   * @param {fetchDocuments} fetchDocuments
   * @param {RpcClient} coreRpcClient
   * @param {BlockExecutionDBTransactions} blockExecutionDBTransactions
   */
  constructor(
    identityRepository,
    dataContractRepository,
    fetchDocuments,
    coreRpcClient,
    blockExecutionDBTransactions = undefined,
  ) {
    this.identityRepository = identityRepository;
    this.dataContractRepository = dataContractRepository;
    this.fetchDocumentsFunction = fetchDocuments;
    this.coreRpcClient = coreRpcClient;
    this.blockExecutionDBTransactions = blockExecutionDBTransactions;
  }

  /**
   * Fetch Identity by ID
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    const transaction = this.getDBTransaction('identities');

    return this.identityRepository.fetch(id, transaction);
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    // Data Contracts should be already commited before use
    // so we don't need transaction here

    return this.dataContractRepository.fetch(id);
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
    const transaction = this.getDBTransaction('documents');

    return this.fetchDocumentsFunction(contractId, type, options, transaction);
  }

  /**
   * Fetch Core transaction by ID
   *
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async fetchTransaction(id) {
    try {
      const { result: transaction } = await this.coreRpcClient.getRawTransaction(id);

      return transaction;
    } catch (e) {
      // Invalid address or key error
      if (e.code === -5) {
        return null;
      }

      throw e;
    }
  }

  /**
   * @private
   * @param {string} name
   * @return {LevelDBTransaction|MongoDBTransaction}
   */
  getDBTransaction(name) {
    let transaction;

    if (this.blockExecutionDBTransactions) {
      transaction = this.blockExecutionDBTransactions.getTransaction(name);
    }

    return transaction;
  }
}

module.exports = DriveDataProvider;
