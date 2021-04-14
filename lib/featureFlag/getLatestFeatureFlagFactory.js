/**
 * @param {Identifier} featureFlagDataContractId
 * @param {fetchDocuments} fetchDocuments
 * @param {BlockExecutionContext} blockExecutionContext
 *
 * @return {getLatestFeatureFlag}
 */
function getLatestFeatureFlagFactory(
  featureFlagDataContractId,
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
    const {
      height: blockHeight,
    } = blockExecutionContext.getHeader();

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
