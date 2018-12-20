const StateTransitionPacket = require('../stPacket/StateTransitionPacket');

const PinPacketTimeoutError = require('../errors/PinPacketTimeoutError');
const GetPacketTimeoutError = require('../errors/GetPacketTimeoutError');

const rejectAfter = require('../../util/rejectAfter');

class StateTransitionPacketIpfsRepository {
  /**
   * Create new instance of repository
   *
   * @param {IpfsApi} ipfsApi
   * @param {number} ipfsPinTimeout
   *
   * @return {StateTransitionPacketRepository}
   */
  constructor(ipfsApi, ipfsPinTimeout) {
    this.ipfsApi = ipfsApi;
    this.ipfsPinTimeout = ipfsPinTimeout;
  }

  /**
   * Find packets by CID
   *
   * @param {CID} cid
   *
   * @return {Promise<StateTransitionPacket>}
   */
  async find(cid) {
    const getPromise = this.ipfsApi.dag.get(cid);

    const error = new GetPacketTimeoutError();

    const { value: packetData } = await rejectAfter(getPromise, error, this.ipfsPinTimeout);

    return new StateTransitionPacket(packetData);
  }

  /**
   * Put a packet into IPFS
   *
   * @param {CID} cid
   * @param {object} packetData
   *
   * @return {Promise<CID>}
   */
  async store(cid, packetData) {
    const storePromise = this.ipfsApi.dag.put(packetData, { cid });

    const error = new PinPacketTimeoutError();

    return rejectAfter(storePromise, error, this.ipfsPinTimeout);
  }

  /**
   * Pin a packet by CID
   *
   * @param {CID} cid
   *
   * @return {Promise<void>}
   */
  async download(cid) {
    const storePromise = this.ipfsApi.pin.add(cid, { recursive: true });

    const error = new PinPacketTimeoutError();

    await rejectAfter(storePromise, error, this.ipfsPinTimeout);
  }

  /**
   * Unpin specific packet by CID
   *
   * @param {CID} cid
   *
   * @return {Promise<void>}
   */
  async delete(cid) {
    await this.ipfsApi.pin.rm(cid, { recursive: true });
  }

  /**
   * Unpin all recursive packets
   *
   * @return {Promise<void>}
   */
  async deleteAll() {
    const pinset = await this.ipfsApi.pin.ls();
    const byPinType = type => pin => pin.type === type;
    const pins = pinset.filter(byPinType('recursive'));

    for (let index = 0; index < pins.length; index++) {
      const pin = pins[index];
      await this.ipfsApi.pin.rm(pin.hash);
    }
  }
}

module.exports = StateTransitionPacketIpfsRepository;
