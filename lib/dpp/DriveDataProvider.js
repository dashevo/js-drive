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
   * @returns {Promise<DPContract|null>}
   */
  async fetchDPContract(id) {
    return this.fetchDPContractFromDrive(id);
  }

  /**
   * Fetch DAP Objects
   *
   * @param {string} dpContractId
   * @param {string} type
   * @param {{ where: Object }} [options]
   * @returns {Promise<DPObject[]>}
   */
  async fetchDPObjects(dpContractId, type, options = {}) {
    return this.fetchDPObjectsFromDrive(dpContractId, type, options);
  }

  /**
   * Fetch transaction by ID
   *
   * @param {string} id
   * @returns {Promise<DPContract|null>}
   */
  async fetchTransaction(id) {
    return this.rpcClient.getTransaction(id);
  }
}

module.exports = DriveDataProvider;
