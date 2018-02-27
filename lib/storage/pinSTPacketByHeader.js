/**
 * Add ST packet using ST header
 *
 * @param {IpfsAPI} ipfsApi
 * @param {StateTransitionHeader} stateTransitionHeader
 * @return {Promise<Array>}
 */
module.exports = async function pinSTPacketByHeader(ipfsApi, stateTransitionHeader) {
  return ipfsApi.pin.add(stateTransitionHeader.getStorageHash(), { recursive: true });
};
