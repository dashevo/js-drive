/**
 * @param {getSyncStatus} getSyncStatus
 * @returns {getSyncStatusMethod}
 */
function getSyncStatusMethodFactory(getSyncStatus) {
  /**
   * @typedef getSyncStatusMethod
   * @returns {Promise<Object>}
   */
  async function getSyncStatusMethod() {
    try {
      const syncStatus = await getSyncStatus();
      return syncStatus.toJSON();
    } catch (error) {
      throw error;
    }
  }

  return getSyncStatusMethod;
}

module.exports = getSyncStatusMethodFactory;
