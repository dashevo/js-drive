/**
 * Gets Validator Set Info (factory)
 *
 * @param {RpcClient} coreRpcClient
 *
 * @returns {getValidatorSetInfo}
 */
function getValidatorSetInfoFactory(coreRpcClient) {
  /**
   * Gets Validator Set Info
   * by calling DashCore's quorum info rpc cmd
   *
   * @typedef getValidatorSetInfo
   *
   * @param {number} llmqType
   * @param {string} quorumHash
   * @returns {Promise<Object[]>}
   */
  async function getValidatorSetInfo(llmqType, quorumHash) {
    try {
      const {
        result: {
          members: validators,
        },
      } = await coreRpcClient.quorum('info', `${llmqType}`, `${quorumHash}`);
      return validators;
    } catch (e) {
      // This should never happen
      if (e.code === -8) {
        logger.error(`The quorum of type ${llmqType} and quorumHash ${quorumHash} doesn't exist`);
      } else {
        logger.error(`Unknown quorum info error ${e}`);
      }
      throw e;
    }
  }

  return getValidatorSetInfo;
}

module.exports = getValidatorSetInfoFactory;
