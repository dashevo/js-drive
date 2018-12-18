const StateTransitionPacket = require('../stPacket/StateTransitionPacket');

const PinPacketTimeoutError = require('../errors/PinPacketTimeoutError');

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
   * @param {string} id
   *
   * @return {Promise<StateTransitionPacket>}
   */
  async find(id) {
    const getPromise = this.ipfsApi.dag.get(id);

    const error = new PinPacketTimeoutError();

    const { value: packetData } = await rejectAfter(getPromise, error, this.ipfsPinTimeout);

    return new StateTransitionPacket(packetData);
  }

  /**
   * Put a packet into IPFS
   *
   * @param {string} id
   * @param {object} packetData
   *
   * @return {Promise<string>}
   */
  async store(id, packetData) {
    const storePromise = this.ipfsApi.dag.put(packetData, { cid: id });

    const error = new PinPacketTimeoutError();

    const cid = await rejectAfter(storePromise, error, this.ipfsPinTimeout);

    return cid.toBaseEncodedString();
  }

  /**
   * Pin a packet by CID
   *
   * @param {string} id
   *
   * @return {Promise<string>}
   */
  async update(id) {
    const storePromise = this.ipfsApi.pin.add(id, { recursive: true });

    const error = new PinPacketTimeoutError();

    await rejectAfter(storePromise, error, this.ipfsPinTimeout);

    // Note: is kept here for a sort of compatibility
    // to any other possible repository we may use.
    // As usual repository return an id of updated object.
    return id;
  }

  /**
   * Unpin specific packet by CID
   *
   * @return {Promise<void>}
   */
  async delete(id) {
    await this.ipfsApi.pin.rm(id, { recursive: true });
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
