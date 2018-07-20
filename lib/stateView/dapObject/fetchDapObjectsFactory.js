/**
 * @param {createDapObjectMongoDbRepository} createDapObjectRepository
 * @returns {fetchDapObjects}
 */
function fetchDapObjectsFactory(createDapObjectRepository) {
  /**
   * Fetch Dap Objects by DAP id and type
   *
   * @typedef {Promise} fetchDapObjects
   * @param {string} dapId
   * @param {string} type
   * @returns {Promise<DapObject[]>}
   */
  async function fetchDapObjects(dapId, type) {
    const dapObjectRepository = createDapObjectRepository(dapId);
    return dapObjectRepository.fetch(type);
  }

  return fetchDapObjects;
}

module.exports = fetchDapObjectsFactory;
