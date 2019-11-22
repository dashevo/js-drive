const { Transaction } = require('@dashevo/dashcore-lib');

class DriveDataProvider {
  /**
   * @param {fetchDocuments} fetchDocuments
   * @param {Function} fetchContract
   * @param {RpcClient} coreRPCClient
   * @param {JaysonClient} tendermintRPCClient
   * @param {MongoDBTransaction} stateViewTransaction
   */
  constructor(
    fetchDocuments,
    fetchContract,
    coreRPCClient,
    tendermintRPCClient,
    stateViewTransaction,
  ) {
    this.fetchDocumentsFromDrive = fetchDocuments;
    this.fetchContractFromDrive = fetchContract;
    this.coreRPCClient = coreRPCClient;
    this.tendermintRPCClient = tendermintRPCClient;
    this.stateViewTransaction = stateViewTransaction;
  }

  /**
   * Fetch Data Contract by ID
   *
   * @param {string} id
   * @returns {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    return this.fetchContractFromDrive(id);
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
    return this.fetchDocumentsFromDrive(contractId, type, options, this.stateViewTransaction);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<{ confirmations: number }|null>}
   */
  async fetchTransaction(id) {
    try {
      const { result: transaction } = await this.coreRPCClient.getRawTransaction(id);
      return new Transaction(transaction);
    } catch (e) {
      // Invalid address or key error
      if (e.code === -5) {
        return null;
      }

      throw e;
    }
  }

  /**
   * Fetch identity by it's id
   *
   * @param {string} id
   *
   * @return {Promise<Identity|null>}
   */
  async fetchIdentity(id) {
    const { result: identity } = await this.tendermintRPCClient.request(
      'abci_query',
      {
        path: '/identity',
        data: id,
      },
    );

    return identity;
  }
}

module.exports = DriveDataProvider;
