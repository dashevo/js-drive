/**
 * @param {Identifier} featureFlagDataContractId
 * @param {number} featureFlagDataContractBlockHeight
 * @param {fetchDocuments} fetchDocuments
 * @param {BlockExecutionContext} blockExecutionContext
 *
 * @return {getLatestFeatureFlag}
 */
function getLatestFeatureFlagFactory(
  featureFlagDataContractId,
  featureFlagDataContractBlockHeight,
  fetchDocuments,
  blockExecutionContext,
) {
  /**
   * @typedef getLatestFeatureFlag
   *
   * @param {string} flagType
   *
   * @return {Promise<Document|null>}
   */
  async function getLatestFeatureFlag(flagType) {
    if (!featureFlagDataContractId) {
      return null;
    }

    const {
      height: blockHeight,
    } = blockExecutionContext.getHeader();

    if (blockHeight.toInt() < featureFlagDataContractBlockHeight) {
      return null;
    }

    const query = {
      where: [
        ['enableAtHeight', '<=', blockHeight.toInt()],
      ],
      orderBy: [
        ['enableAtHeight', 'desc'],
      ],
      limit: 1,
    };

    const [document] = await fetchDocuments(
      featureFlagDataContractId,
      flagType,
      query,
    );

    return document;
  }

  return getLatestFeatureFlag;
}

module.exports = getLatestFeatureFlagFactory;
