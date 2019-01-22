class DriveDataProvider {
  /**
   * @param {fetchDPObjects} fetchDPObjects
   * @param {fetchDPContract} fetchDPContract
   * @param {RpcClient} rpcClient
   */
  constructor(fetchDPObjects, fetchDPContract, rpcClient) {
    this.fetchDPObjectsFromDrive = fetchDPObjects;
    this.fetchDPContractFromDrive = fetchDPContract;
    this.rpcClient = rpcClient;
  }

  /**
   * Fetch Dap Contract
   *
   * @param {string} id
   * @return {DPContract|null}
   */
  async fetchDPContract(id) {
    return this.fetchDPContractFromDrive(id);
  }

  /**
   * Fetch DAP Objects
   *
   * @param {string} contractId
   * @param {string} type
   * @param {{ where: Object }} [options]
   * @return {DPObject[]}
   */
  async fetchDPObjects(contractId, type, options = {}) {
    return this.fetchDPObjectsFromDrive(contractId, type, options);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @return {{ confirmations: number }}
   */
  async fetchTransaction(id) {
    return this.rpcClient.getTransaction(id);
  }
}

module.exports = DriveDataProvider;
