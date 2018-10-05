const StateTransitionPacket = require('../../storage/StateTransitionPacket');
const DapContract = require('./DapContract');
const doubleSha256 = require('../../util/doubleSha256');

/**
 * @param {DapContractMongoDbRepository} dapContractRepository
 * @param {IpfsAPI} ipfs
 * @returns {storeDapContract}
 */
function storeDapContractFactory(dapContractRepository, ipfs) {
  /**
   * Validate and store DapContract
   *
   * @typedef storeDapContract
   * @param {string} cid ST Packet CID
   * @returns {Promise}
   */
  async function storeDapContract(cid) {
    const { value: packetData } = await ipfs.dag.get(cid);

    const packet = new StateTransitionPacket(packetData);

    const dapId = doubleSha256(packet.dapcontract);
    const { dapname: name, dapschema: schema } = packet.dapcontract;

    const dapContract = new DapContract(dapId, name, cid, schema);

    return dapContractRepository.store(dapContract);
  }

  return storeDapContract;
}

module.exports = storeDapContractFactory;
