/**
 * Add ST packet using ST header
 *
 * @param {IpfsAPI} ipfsApi
 * @param {StateTransitionHeader} stateTransitionHeader
 * @return {Promise<Array>}
 */
module.exports = async function addSTPacketByHeader(ipfsApi, stateTransitionHeader) {
  return ipfsApi.pin.add(stateTransitionHeader.getStorageHash(), { recursive: true });
};
