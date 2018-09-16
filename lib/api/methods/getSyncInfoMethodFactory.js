/**
 * @param {getSyncInfo} getSyncInfo
 * @returns {getSyncInfoMethod}
 */
function getSyncInfoMethodFactory(getSyncInfo) {
  /**
   * @typedef getSyncInfoMethod
   * @returns {Promise<Object>}
   */
  async function getSyncInfoMethod() {
    try {
      const syncStatus = await getSyncInfo();
      return syncStatus.toJSON();
    } catch (error) {
      throw error;
    }
  }

  return getSyncInfoMethod;
}

module.exports = getSyncInfoMethodFactory;
